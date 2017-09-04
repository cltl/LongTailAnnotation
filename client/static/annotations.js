$(function(){

    $.get('/listfiles', function(data, status) {
        for(var i = 0; i < data.length; i++) {
            $('#pickfile').append($('<option></option>').val(data[i]).html(data[i]));
        }
    });

});

var showSelected = function(){
    var all = $(".active").map(function() {
        return this.innerHTML;
    }).get();
    console.log(all.join());
    alert(all.join());
}

var loadTextsFromFile = function(fn){
    $.get("/gettext", {'filename': fn}, function(data, status) {
        all_html = "";
        for (var k in data) {
            all_html += '<h2>' + k + '</h2>';
            for (var span_id in data[k]) {
                var token = data[k][span_id];
                all_html += "<span id=" + k + span_id + " class=\"clickable\">" + token + "</span> ";
            }
        }
        console.log(all_html);
        $("#bigdiv").html(all_html);
	$(".clickable").click(function() {  //use a class, since your ID gets mangled
	    $(this).toggleClass("active");      //add the class to the clicked element
	  });


        return all_html;
    });
}

var updateTexts = function(){
    var filename = $("#pickfile").val();
    if (filename!="-1"){
        var h = loadTextsFromFile(filename);
    } else{
        $("#info").val("File not selected");
    }
}
