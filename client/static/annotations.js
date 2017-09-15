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
       //if (data.length==0) cb({});
/*
        var out_ann={};
        var et_c=0;
       
       //count_keys=0; 
       //for (var event_type in data) { count_keys++; }

        for (var event_type in data) {
            var ev_c=0; 
            while(ev_c<data[event_type].length) {
                var m_c=0;
                while(m_c<data[event_type][ev_c].length){
                    var mention = data[event_type][ev_c][m_c];
                    out_ann[mention]={'et':event_type, 'ev_c': ev_c};
                    if (++m_c==data[event_type][ev_c].length && ev_c==data[event_type].length-1 && et_c==count_keys-1){
                        cb(out_ann);
                    } 
                }
                ev_c++;
            }
            et_c++;
        }
*/
    });

}

var saveEvent = function(){
    var allMentions = $(".active").map(function() {
        return $(this).attr('id');
    }).get();
    if ($("#eventtype").val()!='b'){
        var allParticipants = $(".selected").map(function() {
            return $(this).attr('data-index');
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

var loadTextsFromFile = function(fn){
    $.get("/gettext", {'inc': fn}, function(data, status) {
        getExistingAnnotations(fn, function(annotated){
        var all_html = {"l": "", "r": ""};
        var c=0, pos="";
        for (var k in data) {
            if (c++%2==0) pos="l";
            else pos="r";
            all_html[pos] += "<div class=\"panel panel-default\">";
            all_html[pos] += "<div class=\"panel-heading\"><h4 class=\"panel-title\">" + k + "<br/>(<i>Published on: <span id=" + k + "dct>" + data[k]['DCT'] + "</span></i>)</h4></div>";
            all_html[pos] += "<div class=\"panel-body\">";
            for (var span_id in data[k]) {
                if (span_id!="DCT"){ // TODO: After the last dot only
                    var token = data[k][span_id];
                    var tid = k + '.' + span_id;
                    if (!annotated[tid]){
                        all_html[pos] += "<span id=" + tid + " class=\"clickable\">" + token + "</span> ";
                    } else {
                        all_html[pos] += "<span id=" + tid + " class=\"event_" + annotated[tid]['eventtype'] + "\">" + token + "<sub>" + annotated[tid]['participants'] + '</sub><sup>' + annotated[tid]['cardinality'] + "</sup></span> ";
                    }
                }
            }
            all_html[pos] += "</div></div>";
        }
        $("#pnlLeft").html(all_html["l"]);
        $("#pnlRight").html(all_html["r"]);
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
