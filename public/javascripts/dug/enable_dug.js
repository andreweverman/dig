// submitting dug. extra check for if there is something selected
$('#submit_dug').click(
    function submit_existing() {

        let val = $(".existing_playlists").find('.list-group-item-success')
        let dug_id = val[0].value
        if (dug_id != "") {
            $.ajax({
                url: '/services/dug/enable/existing_playlist',
                type: 'PUT',
                data: { dug_id: dug_id },
                success: function (response) {
                    console.log("Success putting")
                    window.location.href = "/";

                },
                error: function (request, msg, error) {
                    console.log("Error putting", error);
                    window.location.href = "/";
                }
            });

        }
    }

);

// submitting dig. extra check for if there is something selected
$('#create_playlist_submit').click(
    function submit_new() {

        let new_playlist_name = $("#create_playlist_text").val();

        if (new_playlist_name != "") {

            $.ajax({
                url: '/services/dug/enable/new_playlist',
                type: 'PUT',
                data: { new_playlist_name: new_playlist_name },
                success: function (response) {
                    console.log("Success putting")
                    window.location.href = "/";
                }
                ,
                error: function (request, msg, error) {
                    console.log("Error putting", error);
                    window.location.href = "/";
                }
            });


        }
    }

);

// this is for the selecting of the playlist element
$('.playlist_item').click(function change() {

    let find_primary = $(this.parentElement).find('.list-group-item-success');
    if (find_primary.length != 0) {
        for (let i = 0; i < find_primary.length; i++) {
            $(find_primary[i]).removeClass("list-group-item-succecss")
            $(find_primary[i]).addClass("list-group-item-dark")
        }

    }

    if ($(this).hasClass("list-group-item-dark")) {
        $(this).removeClass("list-group-item-dark")
        $(this).addClass("list-group-item-success")
    }

    if ($('#dug_select').val() != '') {
        $('#submit_dug').prop('disabled', false)
    }
});





// disabling of button if no text
$("#create_playlist_text").change(function check() {

    let enabled = !($("#create_playlist_submit").prop("disabled"));
    let empty = ($(this).val() == '');
    let val = true;

    $("#create_playlist_submit").prop("disabled", enabled && empty);


});


// disabling of button if no text. can get around without this
$("#create_playlist_submit").hover(function check() {
    let empty = ($("#create_playlist_text").val() == '');
    $(this).prop("disabled", empty);
});

