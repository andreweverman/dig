$(".disable_service").click(
    function disable() {
        if (confirm("Are you sure?")) {
            $.ajax({
                url: '/disable_dig',
                type: 'DELETE',

                success: function (response) {
                
                    window.location.reload(true);
                }
                ,
                error: function (request, msg, error) {
                    window.location.reload(true);
                }
            });


        }

    }
)