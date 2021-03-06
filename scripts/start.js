const mainCanvas = document.getElementById('mainCanvas')
const mainCtx = mainCanvas.getContext('2d')
let ctx = mainCtx

let mainWidth,
	mainHeight,
	baseWidth = 1980,
	baseHeight = 1080,

	dt = 0,
	timestamp = 0

const resizeCanvas = () => {
	mainWidth = innerWidth
	mainHeight = innerHeight
	mainCanvas.width = mainWidth
	mainCanvas.height = mainHeight
}
resizeCanvas()
window.onresize = () => { resizeCanvas() }

const gameSize = 5000
let x = 0
let y = 0
let zoom = 1
let viewX = 0
let viewY = 0
let viewZoom = 1

function drawProgressBar(ctx, width, height, frac, barColor) {
	frac < 0 && (frac = 0);
	frac > 1 && (frac = 1);
	barColor == null && (barColor = "#86c280");
	ctx.beginPath();
	ctx.moveTo(0, 0);
	ctx.lineTo(width, 0);
	ctx.closePath();
	ctx.lineCap = "round";
	ctx.lineWidth = height;
	ctx.strokeStyle = "#545454"
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(0, 0);
	ctx.lineTo(width * frac, 0);
	ctx.closePath();
	ctx.lineCap = "round";
	let lw = height < 10 ? height - 3 : Math.round(height * 0.7);
	ctx.lineWidth = lw;
	ctx.strokeStyle = barColor;
	ctx.stroke();
}

const canvas = (w, h, callback) => {
	let canvas = document.createElement('canvas')
	canvas.width = w
	canvas.height = h 
	callback && callback(canvas.getContext('2d'))
	return canvas
}

const grid = (size, t) => {
	return mainCtx.createPattern(canvas(size, size, (ctx) => {
		ctx.fillStyle = '#c6c6c6'
		ctx.fillRect(0, size/2, size, t)
		ctx.fillRect(size/2, 0, t, size)
	}), 'repeat')
}

let game = new Realm(0, 0, gameSize, gameSize)
game.spawn('square', 540)
game.spawn('triangle', 40)
game.spawn('pentagon', 10)

let s = 1000
let pRange = new Rectangle(game.w / 2 - s/2, game.h / 2 - s/2, s, s)
game.spawn('pentagon', 29, pRange, 0.1)

let tank = new Tank(0 * Math.random() * game.w, Math.random() * game.h, 0, 'purple')
game.addPolygon(tank)
game.addPolygon(builderTank)

let keys = {}
document.onkeydown = (evt) => {
	if(evt.repeat) return false

	keys[evt.key] = true
	if(evt.key == 'e') view.autoFire = view.autoFire ? false : true
	if(evt.key == 'c') view.autoSpin = view.autoSpin ? false : true
}

let c = false
document.onmousedown = () => { (c = true) }
document.onmouseup = () => { c = false }



document.onkeyup = (evt) => {
	delete keys[evt.key]
}

let mx = 0
let my = 0

document.onmousemove = (evt) => {
	mx = evt.clientX - mainWidth / 2
	my = evt.clientY - mainHeight / 2
}


let view = tank
let viewIndex = 0

/*addEventListener('keydown', (e) => {
	if(e.key == 'g') viewIndex -= 1
	else if(e.key == 'h') viewIndex += 1
	if(viewIndex < 0) {
		viewIndex = 0
	} else if(viewIndex >= game.polygons.length - 1) {
		viewIndex = game.polygons.length - 1
	}
	view = game.polygons[viewIndex]
}, true)*/

const update = () => {
	x = view.x
	y = view.y

	viewX = (x * 2 + viewX * 8) / 10
	viewY = (y * 2 + viewY * 8) / 10
	viewZoom = (zoom * 2 + viewZoom * 8) / 10


	if(view.isTank) {
		if(builderEnabled == false) {
			let angle = Math.atan2(viewY + my - view.y, viewX + mx - view.x)
			!view.autoSpin && !view.destroyed &&  (view.angle = angle)
			view.control(keys)
			if(c && view.autoFire == false) {
				view.fire()
			}
		} else {
			view.control({})
		}
	}
	

	game.update()
}

const draw = () => {
	mainCtx.clearRect(0, 0, mainWidth, mainHeight)
	mainCtx.fillStyle = '#cdcdcd'
	mainCtx.fillRect(0, 0, mainWidth, mainHeight)
	mainCtx.save()
	mainCtx.translate(-viewX * viewZoom, -viewY * viewZoom)
	mainCtx.translate(mainWidth / 2, mainHeight / 2)
	mainCtx.fillStyle = grid(20, 1)
	mainCtx.scale(viewZoom, viewZoom)
	mainCtx.fillRect(x - mainWidth / 2 / zoom, y - mainHeight / 2 / zoom, mainWidth / zoom, mainHeight / zoom)
	
	let range = new Rectangle(x - mainWidth / 2, y - mainHeight / 2, mainWidth, mainHeight)
	let arr = []
	game.qt.query(range, (a) => {
		arr.push(a)
	})
	arr = arr.sort((a, b) => a.r - b.r)
	arr.forEach(a => a.draw(mainCtx))

	// game.qt.draw(mainCtx)

	
	mainCtx.restore()

	mainCtx.save()
	let w = 301
	let h = 21
	mainCtx.translate(mainWidth/2 - w / 2, mainHeight - 50)
	drawProgressBar(mainCtx, w, h,  1 - (view.nextScore -view.score) /  (view.nextScore - view.previousScore), '#E7D063')
	mainCtx.textAlign = 'center'
	mainCtx.textBaseline = 'middle'
	mainCtx.fillStyle = '#fff'
	mainCtx.font = '15px Arial'
	mainCtx.fillText('Level ' + view.level, w/2, h/2)
	mainCtx.restore()

	let mSize = 120

	mainCtx.save()
	mainCtx.translate(mainWidth - 15 - mSize + view.x/gameSize * mSize, mainHeight - 15 - mSize + view.y/gameSize * mSize)
	mainCtx.rotate(view.angle)
	mainCtx.beginPath()
	mainCtx.fillStyle = '#3f3f3f'
	trianglePoints.forEach(p => {
		mainCtx.lineTo(p[0] * 4, p[1] * 3)
	})
	mainCtx.closePath()
	mainCtx.fill()
	mainCtx.restore()


	mainCtx.lineWidth = 4
	mainCtx.lineCap = 'round'
	mainCtx.lineJoin = 'round'
	mainCtx.strokeStyle = '#888'
	mainCtx.strokeRect(mainWidth - 15 - mSize - 2, mainHeight - 15 - mSize - 2, mSize + 4, mSize + 4)
	mainCtx.fillStyle = 'rgba(255, 255, 255, 0.06)'
	mainCtx.fillRect(mainWidth - 15 - mSize, mainHeight - 15 - mSize, mSize, mSize)

}	

const loop = () => {
	let currTime = Date.now()
	dt = currTime - (timestamp || currTime)
	dt = Math.min(1000, dt)
	timestamp = currTime

	if(dt < 200) {
		update()
		draw()
	} 
	window.requestAnimationFrame(loop)
}

loop()



function setFavicon() {
	let blueTank = canvas(64, 64, ctx => {
		let t = new Tank(24, 40, 0, "blue")
		t.angle = -Math.PI / 6;
		t.r = 18;
		t.strokeColor = colors["grey"][1]
		t.draw(ctx);
	});
	let favEle = document.createElement("link");
	favEle.setAttribute("rel", "icon");
	favEle.setAttribute("href", blueTank.toDataURL());
	document.head.appendChild(favEle)
}

setFavicon()

