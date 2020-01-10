

// submitting dig. extra check for if there is something selected
$('#submit_dug').click(
    function validate() {

        let dug_select = document.getElementById("dug_select").value;
    
        if (dug_select != "") {
            document.write("Redirecting");
            location.assign('/enable_dug/valid?dug_id=' + dug_select);
    
        }
    }

)


// for the disabling of the button
$('#dug_credentials').change(function () {
    if ($('#dug_select').val() != ''){
        $('#submit_dug').prop('disabled', false)
    }
})


