$("#zaza").on('click', function(){
    let pg1 = $("#pg1")
    let pg2 = $("#pg2")

    let currentShow = pg1
    let currentNone = pg2
    if(pg1.css('display') == 'none'){
    currentNone = pg1
    currentShow = pg2
    }

    currentShow.css('display','none')
    currentNone.css('display','block')
})


$( document ).on('ready',function(){
    $("#pg2").css('display','none')
})
