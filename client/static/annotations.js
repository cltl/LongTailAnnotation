$(function(){

    $.get('/listincidents', function(unsorted, status) {
        var data = unsorted.sort();
        for(var i = 0; i < data.length; i++) {
            $('#pickfile').append($('<option></option>').val(data[i]).html(data[i]));
        }
    });
    $("#annotation").hide();
});

var getExistingAnnotations = function(){
    return {"b": [], "s": [], "h": [], "i": [], "d": []};
}

var saveEvent = function(){
    var all = $(".active").map(function() {
        return $(this).attr('id');
    }).get();
    var event_type = $("#eventtype").val();
    annotations[event_type].push(all);
   $.post("/storeannotations", {'annotations': annotations, 'task': 'men', 'incident': $("#pickfile").val()}, function(data, status){
    });
}

var loadTextsFromFile = function(fn){
    $.get("/gettext", {'inc': fn}, function(data, status) {
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
                    all_html[pos] += "<span id=" + k + '.' + span_id + " class=\"clickable\">" + token + "</span> ";
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
}

var annotations={};

var getStructuredData = function(inc) {
    $.get('/getstrdata', {'inc': inc}, function(data, status) {
        console.log(data);
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
        annotations = getExistingAnnotations();
    } else{
        $("#info").val("File not selected");
    }
}
