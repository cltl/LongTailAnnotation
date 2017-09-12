$(function(){

    $.get('/listincidents', function(unsorted, status) {
        var data = unsorted.sort();
        for(var i = 0; i < data.length; i++) {
            $('#pickfile').append($('<option></option>').val(data[i]).html(data[i]));
        }
    });
    $("#annotation").hide();
});

/*
var getExistingAnnotations = function(){
    var incident = $("#pickfile").val();
    $.post('/loadannotations', {'task': 'men', 'incident': incident}, function(data, status){
        if (!data) {console.log('no data'); annotations={"s": [], "b": [], "i": [], "h": [], "d": []};}
        else { 
            annotations=data;
            for (var event_type in data) {
                console.log(event_type);
                for (var ev in data[event_type]){
                    console.log(ev);
                    for (var mid in data[event_type][ev]){
                        var mention = data[event_type][ev][mid].replace(/\./g, "\\\\.").trim();
                        console.log(mention);
                        $('#' + mention).addClass("event" + event_type);
                    }
                }
            }

        }
//    });
//}
*/

var getExistingAnnotations = function(fn, cb){
    $.post('/loadannotations', {'task': 'men', 'incident': fn}, function(data, status){
         if (!data) {console.log('no data'); annotations={};}//"s": [], "b": [], "i": [], "h": [], "d": []};}
         else {
            annotations=data;
        }
        var out_ann={};
        var et_c=0;
       
       count_keys=0; 
       for (var event_type in data) { count_keys++; }
       if (count_keys==0) cb({});

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
    });
}

var saveEvent = function(){
    var all = $(".active").map(function() {
        return $(this).attr('id');
    }).get();
    var event_type = $("#eventtype").val();
    if (!annotations[event_type]) annotations[event_type]=[];
    annotations[event_type].push(all);
    $.post("/storeannotations", {'annotations': annotations, 'task': 'men', 'incident': $("#pickfile").val()}, function(data, status){
        loadTextsFromFile($("#pickfile").val());
    });
}

var loadTextsFromFile = function(fn){
    $.get("/gettext", {'inc': fn}, function(data, status) {
        getExistingAnnotations(fn, function(stuff){
        console.log(stuff);
        var all_html = {"l": "", "r": ""};
        var c=0, pos="";
        for (var k in data) {
            if (c++%2==0) pos="l";
            else pos="r";
            all_html[pos] += "<div class=\"panel panel-default\">";
            all_html[pos] += "<div class=\"panel-heading\"><h4 class=\"panel-title\">" + k + "<br/>(<i>Published on: <span id=" + k + "dct>" + data[k]['DCT'] + "</span></i>)</h4></div>";
            all_html[pos] += "<div class=\"panel-body\">";
            for (var span_id in data[k]) {
                if (span_id!="DCT"){
                    var token = data[k][span_id];
                    var tid = k + '.' + span_id;
                    if (!stuff[tid]){
                        all_html[pos] += "<span id=" + tid + " class=\"clickable\">" + token + "</span> ";
                    } else {
                        all_html[pos] += "<span id=" + tid + " class=\"event_" + stuff[tid]['et'][0] + "\">" + token + "(" + stuff[tid]['ev_c'] + ")</span> ";
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
        var str_html = "<span id=\"strloc\">Location: " + data['address'] + ", " + data['city_or_county'] + ", " + data['state'] + "</span><br/><span id=\"strtime\">Date: " + data['date'] + "</span><br/><span id=\"strpart\">Participants: " + JSON.stringify(data['participants']) + "</span>"; 
        $("#strinfo").html(str_html);
    });
}

var loadIncident = function(){
    var inc = $("#pickfile").val();
    if (inc!="-1"){
        $("#annotation").show();
        getStructuredData(inc);
        loadTextsFromFile(inc);
        //getExistingAnnotations(); 
   } else{
        $("#info").val("File not selected");
    }
}
