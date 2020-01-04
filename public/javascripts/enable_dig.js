

// submitting dig. extra check for if there is something selected
$('#submit_dig').click(
    function validate() {

        let dig_select = document.getElementById("dig_select").value;
    
        if (dig_select != "") {
            document.write("Redirecting");
            location.assign('/enable_dig/valid?dig_id=' + dig_select);
    
        }
    }

)


// for the disabling of the button
$('#dig_credentials').change(function () {
    if ($('#dig_select').val() != ''){
        $('#submit_dig').prop('disabled', false)
    }
})


