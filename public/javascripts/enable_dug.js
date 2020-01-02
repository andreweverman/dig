document.getElementById("submit_dug").addEventListener("click", validate);



function validate() {

    let dug_select = document.getElementById("dug_select").value;

    if (dug_select != "") {
        document.write("Redirecting");
        location.assign('/enable_dug/valid?dug_id=' + dug_select);

    }
}


