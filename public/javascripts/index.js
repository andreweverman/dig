$(".disable_service").click(
    function disable() {

        let disable_url = $(this).attr('id');
        if (confirm("Are you sure?")) {
            $.ajax({
                url: disable_url,
                type: 'DELETE',
                success: function (response) {
                    window.location.reload(true);
                },
                error: function (request, msg, error) {
                    window.location.reload(true);
                }
            });
        }
    }
)

$(".toggle_service").click(
    function disable() {

        let toggle_url = $(this).attr('id');

        $.ajax({
            url: toggle_url,
            type: 'PUT',
            success: function (response) {
                window.location.reload(true);
            },
            error: function (request, msg, error) {
                window.location.reload(true);
            }
        });

    }
)