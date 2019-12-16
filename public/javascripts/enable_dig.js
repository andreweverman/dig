document.getElementById("submit_dig_credentials").onsubmit = validate;


function validate() {

    let dig_select = document.getElementById("dig_select");

    if (dig_select.value != ""){
        document.write("Henlo");
        location.assign('/enable_dig/valid?dig_id='+dig_select.value);

    }
    

   
}             

