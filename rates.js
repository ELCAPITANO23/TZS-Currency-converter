async function fetchTZSRates() {
      try {
        const response = await fetch("https://open.er-api.com/v6/latest/TZS");
        const data = await response.json();
        console.log(data);        
        }
      catch (err) {
        console.error(err);
        document.getElementById("table-body").innerHTML =
          "<tr><td colspan='3' class='err-cell'>Could not load rates. Check connection.</td></tr>";
      }
}
fetchTZSRates();