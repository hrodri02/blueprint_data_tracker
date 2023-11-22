const url = new URL(location.href); 
const studentName = url.searchParams.get("title")

const h1 = document.querySelector('h1');
h1.innerText = studentName;

const container = document.getElementsByClassName('days-flex-container')[0];
createDays();

function createDays() {
    const days = ['11/21', '11/22', '11/23', '11/24', '11/25'];
    for (let i = 0; i < days.length; i++) {
        container.innerHTML += `
            <div class="flex-item">
                <h3>${days[i]}</h3>
                <select>
                    <option value="">--Attendance--</option>
                    <option value="Present">Present</option>
                    <option value="Tardy">Tardy</option>
                    <option value="Left Early">Left Early</option>
                    <option value="No Session">No Session</option>
                    <option value="No School">No School</option>
                </select>
                <input type='number' min='0' max='4'>
                <button>G</button>
                <button>R</button>
                <button>A</button>
                <button>D</button>
                <button>E</button>
                <button>S</button>
            </div>
        `
    }
}