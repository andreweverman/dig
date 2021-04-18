$(".disable_service").on('click',
    function () {
        let disable_url = $(this).attr('id');

        if (confirm("Are you sure?")) {
            $.ajax({
                url: disable_url,
                type: 'DELETE',
                success: function () {
                    location.reload();
                },
                error: function (){
                    location.reload();
                }
            });
        }
    }
)


$('.toggle_service').on('click', function () {
    let toggle_url = $(this).attr('id');

    $.ajax({
        url: toggle_url,
        type: 'PUT',
        success: () => {
            location.reload();
        },
        error: () => {
            location.reload();
        }
    });
})