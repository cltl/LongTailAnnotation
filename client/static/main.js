//            $("#output").addClass("alert alert-success animated fadeInUp").html("Welcome back " + "<span style='text-transform:uppercase'>" + uname + "</span>");

$(function(){
    if (document.title=='Login'){
        $('#btnLogin').click(function(e) {
            e.preventDefault();
            logMeIn();
        });
    } else {
        $.get('/userstats', {task: 'men'}, function(data, status) {
            console.log('hello');
            console.log(data);
            $("#mendocs").html(data['men_docs']);
            $("#menincs").html(data['men_incs']);
            $("#strdocs").html('0');
            $("#strincs").html('0');
        });
    }
});

var downloadAnnotations = function(u){
    window.open('/exportannotations?annotator=' + u);
    //$.get('/exportannotations', {'annotator': u}, function(data, status){
        
    //});
}

var logout = function(){
    $.get("/logout");
}

var logMeIn = function(){
    var uname = $("#uname").val();
    var pass = $('#pass').val();
    if (uname!="" && pass!=""){
        var url = "/login?username=" + encodeURIComponent(uname) + "&password=" + encodeURIComponent($('#pass').val()); 
        $.post(url, function( data, status ) {
            if (data!="OK"){
                $("#output").removeClass(' alert alert-success');
                $("#output").addClass("alert alert-danger animated fadeInUp").html("Login information incorrect!");
            } else {
                window.location.href = "/dash";
            }
    });
    } else{
        $("#output").removeClass(' alert alert-success');
        $("#output").addClass("alert alert-danger animated fadeInUp").html("Empty username or password!");
    }
}

