

// submitting dig. extra check for if there is something selected
$('#submit_dig').click(
    function submit() {

        let val = $(".existing_playlists").find('.list-group-item-success')
        let dig_id = val[0].value
        if (dig_id != "") {
            document.write("Redirecting");
            location.assign('/enable_dig/valid?dig_id=' + dig_id);

        }
    }

)


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

    if ($('#dig_select').val() != '') {
        $('#submit_dig').prop('disabled', false)
    }
})




