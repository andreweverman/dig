
let access_token_html = document.getElementById("refresh_string");

document.getElementById('obtain-new-token').addEventListener('click', function() {
    $.ajax({
      url: '/refresh_token',
      data: {
        'refresh_token': refresh_token
      }
    }).done(function(data) {
        access_token_html.innerHTML = data.access_token;
      
    });
  }, false);