// submitting dig. extra check for if there is something selected
$('#submit_existing_playlist').on('click',
    function () {
        let serviceRoute = $("#service_route").data('val')
        let val = $(".existing_playlists").find('.list-group-item-success')        
        let playlistID = val[0].value
        if (playlistID != "") {
            $.ajax({
                url: `/services/${serviceRoute}/enable/existing_playlist`,
                type: 'PUT',
                data: { playlistID: playlistID },
                success: function (response) {
                    console.log("Success putting")
                    let goTo ='/'
                    if (response.goTo!=undefined) {
                        goTo = response.goTo
                    }
                    window.location.href = goTo

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
$('#create_playlist_submit').on('click',
    function () {

        let newPlaylistName = $("#create_playlist_text").val();

        if (newPlaylistName != "") {

            $.ajax({
                url: '/services/catalog/enable/new_playlist',
                type: 'PUT',
                data: { newPlaylistName: newPlaylistName },
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

$('.playlist_item').on('click', function () {

    let findPrimary = $(this.parentElement).find('.list-group-item-success');
    if (findPrimary.length != 0) {
        for (let i = 0; i < findPrimary.length; i++) {
            $(findPrimary[i]).removeClass("list-group-item-succecss")
            $(findPrimary[i]).addClass("list-group-item-dark")
        }

    }

    if ($(this).hasClass("list-group-item-dark")) {
        $(this).removeClass("list-group-item-dark")
        $(this).addClass("list-group-item-success")
    }

    $('#submit_existing_playlist').prop('disabled', false)

});



// disabling of button if no text
$("#create_playlist_text").on('change', function () {

    let enabled = !($("#create_playlist_submit").prop("disabled"));
    let empty = ($(this).val() == '');

    $("#create_playlist_submit").prop("disabled", enabled && empty);


});


// disabling of button if no text. can get around without this
$("#create_playlist_submit").on('mouseenter', function check() {
    let empty = ($("#create_playlist_text").val() == '');
    $(this).prop("disabled", empty);
});

