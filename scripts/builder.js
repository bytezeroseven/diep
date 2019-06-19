
document.getElementById('builder').style.display = "none"

let builderTank = new Tank(0, 0, Math.floor(3.5E3 + Math.random() * 1000), 'blue')
let selectedTurret = builderTank.turrets[0] || {}

let inputs = document.querySelectorAll('#editor input')
for(let j = 0; j < inputs.length; j++) {
	let ele = inputs[j]
	let change = () => {
		selectedTurret[ele.getAttribute('data')] = Number(ele.value)
	}
	ele.onkeyup = change
	ele.onchange = change
}

const updateInputsFor = (turret) => {
	for(let j = 0; j < inputs.length; j++) {
		let ele = inputs[j]
		ele.value = turret[ele.getAttribute('data')]
	}
}

const removeTurret = (turret) => {
	let index = builderTank.turrets.indexOf(turret)
	if(index > -1) {
		builderTank.turrets.splice(index, 1)
		mainCanvas.removeEventListener('mousemove', turret.mouseMove, true)
		window.removeEventListener('keydown', turret.keyDown, true)
		if(turret.ele) {
			document.getElementById('turrets').removeChild(turret.ele)
		}
	}
}

let tcount = 0
let builderEnabled = false

const addButtonFor = (turret) => {
	tcount++
	let button = document.createElement('button')
	button.appendChild(document.createTextNode('turret ' + tcount))
	button.onclick = () => {
		selectedTurret = turret
		updateInputsFor(turret)
	}
	turret.ele = button
	document.getElementById('turrets').appendChild(button)
}

const addButtons = () => {
	tcount = 0;
	builderTank.turrets.forEach(turret => {
		addButtonFor(turret)
	})
}

document.getElementById('turret').onclick = () => {
	let turret = new Turret()
	builderTank.addTurret(turret)
	selectedTurret = turret
	let oldAngle = 0
	const mouseMove = (evt) => {
		let x = (evt.x - mainWidth * 0.5) / zoom
		let y = (evt.y - mainHeight * 0.5) / zoom
		let angle = Math.atan2(y, x)
		turret.angle = angle
		updateInputsFor(turret)
	} 
	const keyDown = (evt) => {
		let key = evt.key
		if(key == 'q') {
			addButtonFor(turret)
			window.removeEventListener('mousemove', mouseMove, true)
			window.removeEventListener('keydown', keyDown, true)
		}
	}
	turret.mouseMove = mouseMove
	turret.keyDown = keyDown
	window.addEventListener('mousemove', mouseMove, true)
	window.addEventListener('keydown', keyDown, true)
}
document.getElementById('edit').onclick = () => {
	if(builderEnabled) {
		zoom = 1
		builderEnabled = false
		document.getElementById('builder').style.display = "none"
	} else {
		document.getElementById('turrets').innerHTML = ''
		builderEnabled = true
		builderTank = view || builderTank
		view = builderTank
		builderTank.angle = 0
		addButtons()
		document.getElementById('builder').style.display = 'block'
	}
}
document.getElementById('remove').onclick = () => {
	removeTurret(selectedTurret)
}
document.getElementById('export').onclick = () => {
	let data = []
	builderTank.turrets.forEach(turret => {
		let obj = {};
		turretParams.forEach(p => {
			obj[p] = turret[p]
		});
		data.push(obj)
	})
	alert(`'${JSON.stringify(data)}'`)
}
document.getElementById('import').onclick = () => {
	let data = prompt('Enter data')
	if(data.length < 1) alert('Invalid data')
	else {
		data = data.split('')
		data.shift()
		data.pop()
		builderTank.turrets.forEach(t => removeTurret(t))
		builderTank.loadTurretData(data.join(''))
		addButtons()
	}
}

