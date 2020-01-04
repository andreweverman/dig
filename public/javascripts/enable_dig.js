document.getElementById("submit_dig").addEventListener("click", validate);



function validate() {

    let dig_select = document.getElementById("dig_select").value;

    if (dig_select != "") {
        document.write("Redirecting");
        location.assign('/enable_dig/valid?dig_id=' + dig_select);

    }
}


