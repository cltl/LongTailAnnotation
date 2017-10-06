$(function(){

    disqualification = [];
    $.get('/listincidents', {'task': 'men'}, function(unsorted, status) {
        var old_inc = unsorted['old'];
        var new_inc = unsorted['new'];
        var old_sorted = old_inc.sort();
        var new_sorted = new_inc.sort();
        $('#pickfile').append($('<option></option>').val('-1').html("--INCIDENTS YOU'VE WORKED ON--").prop('disabled', true));
        for(var i = 0; i < old_sorted.length; i++) {
            $('#pickfile').append($('<option></option>').val(old_sorted[i]).html(old_sorted[i]));
        }
        $('#pickfile').append($('<option></option>').val('-1').html("--OTHER INCIDENTS--").prop('disabled', true));
        for(var i = 0; i < new_sorted.length; i++) {
            $('#pickfile').append($('<option></option>').val(new_sorted[i]).html(new_sorted[i]));
        }
    });
//    $("#annotation").hide();
    $("#strtable").bootstrapTable({});
    $(".ann-input").hide();

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



}); // This is where the load function ends!


var clearSelection = function(){
    $('span').removeClass("active");
    $('span').removeClass("inactive");
}



var getExistingAnnotations = function(fn, cb){
    $.post('/loadannotations', {'task': 'men', 'incident': fn}, function(data, status){
         if (!data) {console.log('no data'); annotations={};}//"s": [], "b": [], "i": [], "h": [], "d": []};}
         else {
            annotations=data;
        } 
       cb(data);
    });
}

var getExistingDisqualified = function(fn, cb){
    $.post('/loaddisqualified', {'task': 'men', 'incident': fn}, function(data, status){
         if (!data) {console.log('no data'); disqualification=[];}//"s": [], "b": [], "i": [], "h": [], "d": []};}
         else {
            disqualification=data;
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
    $.post("/storeannotations", {'annotations': annotations, 'task': 'men', 'incident': $("#pickfile").val()}, function(data, status){
        alert("Annotation saved. Now re-loading");
        //loadTextsFromFile($("#pickfile").val());
        reloadInside(mwu);
        defaultValues();
    });
}

var storeDisqAndReload = function(){
    $.post("/storedisqualified", {'disqualification': disqualification, 'task': 'men', 'incident': $("#pickfile").val()}, function(data, status){
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

var toggleDisqualify = function(d){
    if (!$("#" + d).hasClass("disqualified")) { $("#" + d).addClass("disqualified"); $('#btn' + d).html("Mark relevant"); disqualification.push(d); storeDisqAndReload(); }  
    else { $("#" + d).removeClass("disqualified"); $('#btn' + d).html("Mark non-relevant"); var index = disqualification.indexOf(d); if (index > -1) { disqualification.splice(index, 1);} storeDisqAndReload();}
}

var loadTextsFromFile = function(fn){
    $("#pnlLeft").html("");
    $.get("/gettext", {'inc': fn}, function(data, status) {
        getExistingAnnotations(fn, function(annotated){
        getExistingDisqualified(fn, function(disqualified){
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
            if (!disq) header += "<button class=\"btn btn-primary\" id=\"btn" + k + "\" onclick=\"toggleDisqualify(\'" + k + "\')\">Mark non-relevant</button>";
            else header += "<button class=\"btn btn-primary\" id=\"btn" + k + "\" onclick=\"toggleDisqualify(\'" + k + "\')\">Mark relevant</button>";



//            if (!disq) header += "<button class=\"btn btn-primary quabtn\" id=\"btn" + k + "\" onclick=\"toggleDisqualify(" + k + ")\">Disqualify this document</button>";
//            else header += "<button class=\"btn btn-primary disbtn\" id=\"btn" + k + "\" onclick=\"toggleDisqualify(" + k + ")\">Qualify this document</button>";
            header += "</h4></div>";
            body += "</div></div>";
            all_html += header + body;
        }
        $("#pnlLeft").html(all_html);

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

var loadIncident = function(){
    var inc = $("#pickfile").val();
    if (inc!="-1"){
        //$("#annotation").show();
        $("#infoMessage").html("");
        getStructuredData(inc);
        $(".ann-input").show();
        loadTextsFromFile(inc);
        //$("#bigdiv").height("350px");

        //getExistingAnnotations(); 
   } else{
        printInfo("Please select an incident");
    }
}
