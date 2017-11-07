$(function(){

    disqualification = [];
    refDocs = [];
    $(".ann-input").hide();
    if (document.title=="Mention Annotation"){ 
        task = 'men';
    //    $("#annotation").hide();
        $("#strtable").bootstrapTable({});
	$('#strtable tbody').on( 'click', 'tr', function () {
	    $(this).toggleClass('selected');
	} );

	$("#eventtype").on('change', function(){
	    if (this.value=='b' || this.value=='o' || this.value=='g'){
		$("#cardinality").hide();
		$("#strtable").hide();
	    } else {
		$("#cardinality").show();
		$("#strtable").show();
	    }
	});

	for (var i=1; i<=100; i++){
	    $("#cardinality").append($('<option></option>').val(i).html(i));
	}

		$(document).on("click", "span.clickable", function() {  //use a class, since your ID gets mangled
		    $('span').removeClass("inactive");
		    $(this).toggleClass("active");      //add the class to the clicked element
		});
		$(document).on("click", "span.unclickable", function() {  //use a class, since your ID gets mangled
		    $('span').removeClass("active");
		    $(this).toggleClass("inactive");      //add the class to the clicked element
		});
        $("#pnlRight").hide();
    }
    else {
        task = 'str';
        $("#strann").hide();
        $("#newDoc").hide();
        create_datepicker("day", 'yyyy-mm-dd');
        create_datepicker("month", 'yyyy-mm');
        create_datepicker("year", 'yyyy');
	$("#pickday").change(function(){
		if($("#pickday").val()!=""){
		    $("#pickmonth").prop('disabled', true);
		    $("#pickyear").prop('disabled', true);
		} else {
                    $("#pickmonth").prop('disabled', false);
                    $("#pickyear").prop('disabled', false);
		}
	});
        $("#pickmonth").change(function(){
               if($("#pickmonth").val()!=""){
                    $("#pickyear").prop('disabled', true);
                } else {
                    $("#pickyear").prop('disabled', false);
                }

	});
	create_datepicker("day", "yyyy-mm-dd", "newDct");
    }
    $.get('/listincidents', {'task': task}, function(unsorted, status) {
        var old_inc = unsorted['old'];
        var new_inc = unsorted['new'];
        var old_sorted = old_inc.sort();
        var new_sorted = new_inc.sort();
        var trial_incidents = ['761837', '759131', '739413', '773797']
        $('#pickfile').append($('<option></option>').val('-1').html("--INCIDENTS YOU'VE WORKED ON--").prop('disabled', true));
        for(var i = 0; i < old_sorted.length; i++) {
            if (trial_incidents.indexOf(old_sorted[i])>-1) continue;
            $('#pickfile').append($('<option></option>').val(old_sorted[i]).html(old_sorted[i]));
        }
        $('#pickfile').append($('<option></option>').val('-1').html("--OTHER INCIDENTS--").prop('disabled', true));
        for(var i = 0; i < new_sorted.length; i++) {
            if (trial_incidents.indexOf(new_sorted[i])>-1) continue;
            $('#pickfile').append($('<option></option>').val(new_sorted[i]).html(new_sorted[i]));
        }
        $('#pickfile').append($('<option></option>').val('-1').html("--TRIAL DATA INCIDENTS--").prop('disabled', true));
        for(var i = 0; i < trial_incidents.length; i++) {
            $('#pickfile').append($('<option></option>').val(trial_incidents[i]).html(trial_incidents[i]));
        }
    });
}); // This is where the load function ends!


var clearSelection = function(){
    $('span').removeClass("active");
    $('span').removeClass("inactive");
}

var getExistingAnnotations = function(fn, task, cb){
    $.post('/loadannotations', {'task': task, 'incident': fn}, function(data, status){
         if (!data) {console.log('There are no previous annotations of mentions done by this user for this incident.'); annotations={};}//"s": [], "b": [], "i": [], "h": [], "d": []};}
         else {
            console.log("Loaded previous annotations of mentions!"); // + data.length.toString() + " annotations for this incident by this user.");
            annotations=data;
        } 
       cb(data);
    });
}

var create_datepicker = function(granularity, format, manualId=""){
        if (!manualId) var myId="pick" + granularity;
	else var myId=manualId;
        $('#' + myId).datepicker({
            autoclose: true,
	    viewMode: granularity + 's',
            minViewMode: granularity + 's',
            format: format
        });
}

var getExistingDisqualified = function(fn, task, cb){
    $.post('/loaddisqualified', {'task': task, 'incident': fn}, function(data, status){
         if (!data) {console.log('There are no previous disqualifications done by this user for this incident.'); disqualification=[];}//"s": [], "b": [], "i": [], "h": [], "d": []};}
         else {
            console.log("Loaded previous disqualifications!"); // + data.length.toString() + " annotations for this incident by this user.");
            disqualification=data;
        }
       cb(data);
    });
}

var getExistingRefDocs = function(inc, task, cb){
    $.post('/loadreftexts', {'task': task, 'incident': inc}, function(data, status){
         if (!data) {console.log('no data'); refDocs=[];}//"s": [], "b": [], "i": [], "h": [], "d": []};}
         else {
            refDocs=data;
        }
       cb(data);
    });
}

var defaultValues = function(){
        $("#eventtype").val('-1');
        $("#cardinality").val('UNK');
        $("tr").removeClass("selected");
        $("#cardinality").show();
        $("#strtable").show();
}

var getCardinalityAndParticipants = function(){
    if ($("#eventtype").val()=='b'){
	var allParticipants = "ALL";
	var cardinality = "ALL";
    } else if ($("#eventtype").val()=='o' || $("#eventtype").val()=='g'){
	var allParticipants = "UNK";
	var cardinality = "UNK";
    } else {
	var allParticipants = $(".selected").map(function() {
	    return parseInt($(this).attr('data-index'))+1;
	}).get();
	var cardinality = $("#cardinality").val();
    }
    return [cardinality, allParticipants];
}

var reloadInside=function(mwu=false){
    if($("span.active").length>0){
        var cp = getCardinalityAndParticipants();
        var cardinality=cp[0];
        var allParticipants=cp[1];
  
        $("span.active").append("<sub>" + (allParticipants || 'NONE') + '</sub><sup>' + cardinality + "</sup>");
        var newClass = 'event_' + $("#eventtype").val();
        if (!mwu){
            $("span.active").removeClass().addClass(newClass).addClass("unclickable");
        } else {
            $("span.active").removeClass().addClass(newClass).addClass("unclickable").addClass("mwu");
        }
    } else if ($("span.inactive").length>0){
        $("span.inactive").children().remove();
        $("span.inactive").removeClass().addClass("clickable");
    } 
}

var storeAndReload = function(annotations, mwu = false){
    console.log("Storing annotations");
    console.log(annotations);
    $.post("/storeannotations", {'annotations': annotations, 'task': 'men', 'incident': $("#pickfile").val()})
//, function() {
    .done(function() {
        alert( "Annotation saved. Now re-loading." );
        reloadInside(mwu);
        defaultValues();
        showTrails();
    })
    .fail(function() {
        alert( "There was an error with storing these annotations" );
    });


//function(data, status){
//        alert("Annotation saved. Now re-loading, status code:");
}

var storeDisqAndReload = function(task){
    $.post("/storedisqualified", {'disqualification': disqualification, 'task': task, 'incident': $("#pickfile").val()}, function(data, status){
        alert("Disqualified articles updated.");
//        loadTextsFromFile($("#pickfile").val());
    });
}

var removeAnnotations = function(){
    if ($("span.inactive").length>0){
    var allMentions = $(".inactive").map(function() {
        return $(this).attr('id');
    }).get();
    for (var i=0; i<allMentions.length; i++){
        var k = allMentions[i];
        if (annotations[k]['mwu']){
            var mwu = annotations[k]['mwu'];
            for (var j=0; j<mwu.length; j++){
                if (mwu[j]!=k){
                    var index = annotations[mwu[j]]['mwu'].indexOf(k);
                    if (index > -1) {
                        annotations[mwu[j]]['mwu'].splice(index, 1);
                    }
                }
            }
        }
        delete annotations[k];
    }
    storeAndReload(annotations);
    } else {
        printInfo("Select at least one span to remove");
    }
}

Array.prototype.allValuesSame = function() {

    for(var i = 1; i < this.length; i++)
    {
        if(this[i] !== this[0])
            return false;
    }

    return true;
}

var sameSentence = function(allMentions){
    var sents = allMentions.map(function(x) {return x.substring(0,x.lastIndexOf('.')); });
    return sents.allValuesSame();
}

var printInfo = function(msg){
        $("#infoMessage").html(msg);
        $("#infoMessage").removeClass("good_info");
        $("#infoMessage").addClass("bad_info");
}

var saveEvent = function(mwu){
    if ($("#eventtype").val()=='-1'){
        printInfo("Please pick an event type");
    } else {
        var allMentions = $(".active").map(function() {
            return $(this).attr('id');
        }).get();
        if (allMentions.length>0){
            if (mwu && !sameSentence(allMentions)) {
                printInfo("All words of a multiword unit must be in the same sentence");
            } else {
            $("#infoMessage").html("");
            var cp = getCardinalityAndParticipants();
            var cardinality=cp[0];
            var allParticipants=cp[1];

            var event_type = $("#eventtype").val();
            //if (!annotations[event_type]) annotations[event_type]=[];
            //annotations[event_type].push(all);
            for (var i=0; i<allMentions.length; i++){
                var mention=allMentions[i];
                annotations[mention]={'cardinality': cardinality, 'eventtype': event_type, 'participants': allParticipants};
                if (mwu){
                    annotations[mention]["mwu"] = allMentions;
                }
            }
            storeAndReload(annotations, mwu);
            }
        } else {
            printInfo("Please select at least one mention");
        }
    }
}

var addToken = function(token, tid, annotated) {
    if (token=='NEWLINE') return '<br/>';
    else {
	if (!annotated[tid]){
	    return "<span id=" + tid + " class=\"clickable\">" + token + "</span> ";
	} else {
            var mwuClass="";
            if (annotated[tid]["mwu"]) mwuClass="mwu";
	    return "<span id=" + tid + " class=\"event_" + annotated[tid]['eventtype'] + " unclickable " + mwuClass + "\">" + token + "<sub>" + (annotated[tid]['participants'] || 'NONE') + '</sub><sup>' + annotated[tid]['cardinality'] + "</sup></span> ";
	}
    }
    
}

var titleToken = function(tid){
    return tid.split('.')[1][0]=='t';
}

var toggleDisqualify = function(d, task){
    if (!$("#" + d).hasClass("disqualified")) { $("#" + d).addClass("disqualified"); $('#btn' + d).html("Mark relevant"); disqualification.push(d); storeDisqAndReload(task); }  
    else { $("#" + d).removeClass("disqualified"); $('#btn' + d).html("Mark non-relevant"); var index = disqualification.indexOf(d); if (index > -1) { disqualification.splice(index, 1);} storeDisqAndReload(task);}
}

var loadTextsFromFile = function(fn){
    $("#pnlLeft").html("");
    var task = 'men';
    $.get("/gettext", {'inc': fn}, function(data, status) {
        getExistingAnnotations(fn, task, function(annotated){
        getExistingDisqualified(fn, task, function(disqualified){
        var all_html = ""; 
        var c=0;
        for (var k in data) {
            var title = "";
            var body = "<div class=\"panel-body\">";
            for (var span_id in data[k]) {
                if (span_id!="DCT"){ 
                    var token = data[k][span_id];
	            var tid = k + '.' + span_id;
                    if (titleToken(tid)){ //title
                        title+=addToken(token, tid, annotated);
                    } else { //body
                        body+=addToken(token, tid, annotated);
                    } 
                }
            }
            if (!disqualified || disqualified.indexOf(k)==-1) var disq = false;
            else var disq = true;
            if (disq) var header = "<div class=\"panel panel-default disqualified\" id=\"" + k + "\">";
            else var header = "<div class=\"panel panel-default\" id=\"" + k + "\">";
            header += "<div class=\"panel-heading\"><h4 class=\"panel-title\">" + title + "&nbsp;(<i>Published on: <span id=" + k + "dct>" + data[k]['DCT'] + "</span></i>) "; 
            if (!disq) header += "<button class=\"btn btn-primary\" id=\"btn" + k + "\" onclick=\"toggleDisqualify(\'" + k + "\', \'" + task + "\')\">Mark non-relevant</button>";
            else header += "<button class=\"btn btn-primary\" id=\"btn" + k + "\" onclick=\"toggleDisqualify(\'" + k + "\', \'" + task + "\')\">Mark relevant</button>";



//            if (!disq) header += "<button class=\"btn btn-primary quabtn\" id=\"btn" + k + "\" onclick=\"toggleDisqualify(" + k + ")\">Disqualify this document</button>";
//            else header += "<button class=\"btn btn-primary disbtn\" id=\"btn" + k + "\" onclick=\"toggleDisqualify(" + k + ")\">Qualify this document</button>";
            header += "</h4></div>";
            body += "</div></div>";
            all_html += header + body;
        }
        $("#pnlLeft").html(all_html);

        showTrails();
        $("#bigdiv").height($(window).height()-($("#pickrow").height() + $("#titlerow").height()+$("#annrow").height())-20);
        //$("#pnlRight").html(all_html["r"]);
        return all_html;
        });
        });
    });
}

var getStructuredData = function(inc) {
    $.get('/getstrdata', {'inc': inc}, function(data, status) {
        data=JSON.parse(data);
        var participants = data['participants'];
        for (var c=1; c<=participants.length; c++){

            participants[c-1]['Identifier']=c;
        }

        var str_html = "<label id=\"strloc\">Location: " + data['address'] + ", " + data['city_or_county'] + ", " + data['state'] + "</label><br/><label id=\"strtime\">Date: " + data['date'] + "</label><br/><label>Killed: " + data['num_killed'] + "</label>, <label>Injured:" + data['num_injured'] + "</label><br/>";
        $('#strtable').bootstrapTable("load", data['participants']);
// ({
//            data: data['participants']
//        });
// + JSON.stringify(data['participants']) + "</span>"; 
        $("#strinfo").html(str_html);
        var theHeight = $("#strinfo").height()*data['participants'].length*0.6+40;
 $('.fixed-table-container').height(theHeight);
 $('.fixed-table-body').height(theHeight);

    });
}

var refTextsInfo = function(refTxts){
    var sources = "";
    $(refTxts).each(function(index,value){ 
        sources+="<a href=\'" + value.source + "\'>article" + (index+1).toString() + "</a> ";
    });
    $("#addedTxts").html("Manually added reference texts for this incident: " + refTxts.length.toString() + " (" + sources + ")");
}

var getAllInfo = function(inc){
    $.get("/getincinfo", {'inc': inc}, function(data, status) {
        var d = JSON.parse(data);
        var task = 'str';
        getExistingAnnotations(inc, task, function(str_anns){ 
            getExistingDisqualified(inc, task, function(disqualified){
            getExistingRefDocs(inc, task, function(refTxts){
            $(".datepicker").datepicker("update", '');
            if (str_anns){
                $("#location").val(str_anns["location"]);
                $('#pickday').datepicker("update", str_anns["time"]);//.datepicker('update');;
            } else{
                $("#location").val(d["estimated_location"]);
                $('#pickday').datepicker("update", d["estimated_incident_date"]);//.datepicker('update');;
                //$("#pickday").val(d["estimated_incident_date"]);
            }

            var allHtml="";
            $("#pnlLeft").html("");
            for (var i=0; i<d['articles'].length; i++){
                var body="";
                var header="";
                var doc_id = inc + "_" + (i+1).toString();
                if (!disqualified || disqualified.indexOf(doc_id)==-1) var disq = false;
                else var disq = true;

                var article = d['articles'][i];
                if (disq) header = "<div class=\"panel panel-default disqualified\" id=\"" + doc_id + "\">";
                else header = "<div class=\"panel panel-default\" id=\"" + doc_id + "\">";
                header += "<div class=\"panel-heading\"><h4 class=\"panel-title\">" + article['title'] + "&nbsp;(<i>Published on: <span id=" + doc_id + "dct>" + article['dct'] + "</span></i>) ";
                if (!disq) header += "<button class=\"btn btn-primary\" id=\"btn" + doc_id + "\" onclick=\"toggleDisqualify(\'" + doc_id + "\', \'" + task + "\')\">Mark non-relevant</button>";
                else header += "<button class=\"btn btn-primary\" id=\"btn" + doc_id + "\" onclick=\"toggleDisqualify(\'" + doc_id + "\', \'" + task + "\')\">Mark relevant</button>";
                header += "</h4></div>";
                body = "<div class=\"panel-body\">" + article['body'] + "</div>";
                allHtml += header + body;
            }
            $("#pnlLeft").html(allHtml);
            refTextsInfo(refTxts);
            });
            });
        });
    });
}

var getSpanTextById = function(ann_key){
    return $("#" + ann_key.replace(/\./g,'\\.')).html().split('<sub>')[0];
}

var uniqueChains = function(){
    var chains = {};
    var to_skip = [];
    for (ann_key in annotations){
        var element = annotations[ann_key];
        var this_chain = [element["eventtype"], element["participants"] || "NONE", element["cardinality"]].join('#');
        if (!element["mwu"])
            var text = getSpanTextById(ann_key);
        else {
            if (to_skip.indexOf(ann_key)>-1) continue;
            var textArray = [];
            var mwus = element['mwu'];
            for (var i=0; i<mwus.length; i++){
                textArray.push(getSpanTextById(mwus[i]));
                to_skip.push(mwus[i]);
            }
            var text = textArray.join(" ");
        }
        if (this_chain in chains)
            chains[this_chain].push(text);
        else chains[this_chain]=[text];
    }
    return chains;
}

var showTrails = function(){
    var chains = uniqueChains();
    var items = [];
    for (chain in chains) {
        var my_item = '<span class="bolded event_' + chain[0] + '">' + chain + '<br/>(' + chains[chain].join(',') + ')</span>';
        items.push(my_item);
    }
    $("#trails").empty().html(items.join("<br/>"));
}

// Load incident - both for mention and structured annotation
var loadIncident = function(task){
    var inc = $("#pickfile").val();
    if (inc!="-1"){
        //$("#annotation").show();
        $("#infoMessage").html("");
        $(".ann-input").show();
        if (task=='men'){
            getStructuredData(inc);
            loadTextsFromFile(inc);
            $("#pnlRight").show();
        } else { //structured data annotation
            getAllInfo(inc);
            $("#newDoc").show();
        }
        //$("#bigdiv").height("350px");

   } else{
        printInfo("Please select an incident");
    }
}

var getAnnotatedDate=function(){
    return $("#pickday").val() || $("#pickmonth").val() || $("#pickyear").val();
}

var saveStructuredAnnotation = function(){
    var str_ann = {"time": getAnnotatedDate(), "location": $("#location").val()};
    $.post("/storeannotations", {'annotations': str_ann, 'task': 'str', 'incident': $("#pickfile").val()}, function(data, status){
        alert("Annotation saved. Now re-loading");
        location.reload();
//        $(".ann-input").hide();
//        $("#pickfile").val("-1");
//        $("#pnlLeft").html("");
    });
}

var addText = function(){
    var title = $("#newTitle").val();
    var dct = $("#newDct").val();
    var source = $("#newSource").val();
    var content = $("#newBody").val();
    if (title && content && dct && source){
        var newDoc = {'title': title, 'content': content, 'dct': dct, 'source': source};
        refDocs.push(newDoc);
        $.post("/storereftexts", {'documents': refDocs, 'task': 'str', 'incident': $("#pickfile").val()}, function(data, status){
            alert("Reference text stored. Now re-loading");
            location.reload();
        });
    } else{
        printInfo("Please fill all fields for the new reference text: TITLE, DCT, SOURCE URL, and CONTENT/BODY.");
    }
}
