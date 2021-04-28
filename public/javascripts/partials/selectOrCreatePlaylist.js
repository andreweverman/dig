// initial setup for the radio
$(document).on('ready',function () {
    $('#inlineRadio1').trigger("click")
});

// if radio is in existing mode
$("#inlineRadio1").on("click", function () {
    $("#existingPlaylist").show();
    $("#existingSelect").prop('required', true);

    $("#newPlaylist").hide();
    $("#newInput").removeAttr("required");
});

// if radio is in new mode
$("#inlineRadio2").on("click", function () {
    $("#existingPlaylist").hide();
    $("#existingSelect").removeAttr("required");

    $("#newPlaylist").show();
    $("#newInput").prop('required', true);


});


// does the validation work
(function () {
    'use strict'

    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.querySelectorAll('.needs-validation')

    // Loop over them and prevent submission
    Array.prototype.slice.call(forms)
        .forEach(function (form) {
            form.addEventListener('submit', function (event) {
                if (!form.checkValidity()) {
                    event.preventDefault()
                    event.stopPropagation()
                }

                form.classList.add('was-validated')
            }, false)
        })
})()


