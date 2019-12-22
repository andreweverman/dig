document.getElementById("submit_dig").addEventListener("click", validate);



function validate() {

    let dig_select = document.getElementById("dig_select").value;
    let dug_select = document.getElementById("dug_select").value;

    if (dig_select != "" && dig_select != dug_select) {
        document.write("Redirecting");
        location.assign('/enable_dig/valid?dig_id=' + dig_select+"&dug_id="+dug_select);

    }
}


