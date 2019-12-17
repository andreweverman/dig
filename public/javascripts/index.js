
let access_token = document.getElementById("access_token");

document.getElementById('obtain-new-token').addEventListener('click', function () {
    console.log("here")
    $.ajax({
        url: '/refresh_token',
        data: {
            'refresh_token': "<%=user.refresh_token%>"
        }
    }).done(function (data) {
        access_token.innerHTML = data.access_token;

    });
}, false);