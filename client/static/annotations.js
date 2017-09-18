$(function(){

    $.get('/listincidents', function(unsorted, status) {
        var data = unsorted.sort();
        for(var i = 0; i < data.length; i++) {
            $('#pickfile').append($('<option></option>').val(data[i]).html(data[i]));
        }
    });
//    $("#annotation").hide();
    $("#strtable").bootstrapTable({});
    $(".ann-input").hide();

$('#strtable tbody').on( 'click', 'tr', function () {
    $(this).toggleClass('selected');
} );

$("#eventtype").on('change', function(){
    if (this.value=='b'){
        $("#cardinality").hide();
        $("#strtable").hide();
    } else {
        $("#cardinality").show();
        $("#strtable").show();
    }
});

});

var getExistingAnnotations = function(fn, cb){
    $.post('/loadannotations', {'task': 'men', 'incident': fn}, function(data, status){
         if (!data) {console.log('no data'); annotations={};}//"s": [], "b": [], "i": [], "h": [], "d": []};}
         else {
            annotations=data;
        }
 
       cb(data);
    });

}

var saveEvent = function(){
    var allMentions = $(".active").map(function() {
        return $(this).attr('id');
    }).get();
    if ($("#eventtype").val()!='b'){
        var allParticipants = $(".selected").map(function() {
            return parseInt($(this).attr('data-index'))+1;
        }).get();
        var cardinality = $("#cardinality").val();
    } else {
        var allParticipants = "ALL";
        var cardinality = "ALL";
    }
    var event_type = $("#eventtype").val();
    //if (!annotations[event_type]) annotations[event_type]=[];
    //annotations[event_type].push(all);
    for (var i=0; i<allMentions.length; i++){
        var mention=allMentions[i];
        annotations[mention]={'cardinality': cardinality, 'eventtype': event_type, 'participants': allParticipants};
    }
    $.post("/storeannotations", {'annotations': annotations, 'task': 'men', 'incident': $("#pickfile").val()}, function(data, status){
        alert("Annotation saved. Now re-loading");
        loadTextsFromFile($("#pickfile").val());
    });
}

var add_token = function(token, tid, annotated) {
    if (token=='NEWLINE') return '<br/>';
    else {
	if (!annotated[tid]){
	    return "<span id=" + tid + " class=\"clickable\">" + token + "</span> ";
	} else {
	    return "<span id=" + tid + " class=\"event_" + annotated[tid]['eventtype'] + "\">" + token + "<sub>" + annotated[tid]['participants'] + '</sub><sup>' + annotated[tid]['cardinality'] + "</sup></span> ";
	}
    }
    
}

var title_token = function(tid){
    return tid.split('.')[1][0]=='t';
}

var loadTextsFromFile = function(fn){
    $.get("/gettext", {'inc': fn}, function(data, status) {
        getExistingAnnotations(fn, function(annotated){
        var all_html = ""; 
        var c=0, pos="";
        for (var k in data) {
            pos="l";
            var title = "";
            var header = "<div class=\"panel panel-default\">";
            var body = "<div class=\"panel-body\">";
            for (var span_id in data[k]) {
                if (span_id!="DCT"){ // TODO: After the last dot only
                    var token = data[k][span_id];
	            var tid = k + '.' + span_id;
                    if (title_token(tid)){ //title
                        title+=add_token(token, tid, annotated);
                    } else { //body
                        body+=add_token(token, tid, annotated);
                    } 
                }
            }
            header += "<div class=\"panel-heading\"><h4 class=\"panel-title\">" + title + "&nbsp;(<i>Published on: <span id=" + k + "dct>" + data[k]['DCT'] + "</span></i>)</h4></div>";
            body += "</div></div>";
            all_html += header + body;
        }
        $("#pnlLeft").html(all_html);
        //$("#pnlRight").html(all_html["r"]);
	$(".clickable").click(function() {  //use a class, since your ID gets mangled
	    $(this).toggleClass("active");      //add the class to the clicked element
	});
        return all_html;
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

        console.log(data);
        var str_html = "<label id=\"strloc\">Location: " + data['address'] + ", " + data['city_or_county'] + ", " + data['state'] + "</label><br/><label id=\"strtime\">Date: " + data['date'] + "</label><br/><label>Killed: " + data['num_killed'] + "</label><br/><label>Injured:" + data['num_injured'] + "</label><br/>";
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
        getStructuredData(inc);
        loadTextsFromFile(inc);
        $(".ann-input").show();
        //getExistingAnnotations(); 
   } else{
        $("#info").val("File not selected");
    }
}
