const colors = {
	'blue'      : '#00b0e1 #0083a8',
	'green'     : '#00e06c #00a851',
	'red'       : '#f04f54 #b33b3f',
	'yellow'    : '#ffe46b #bfae4e',
	'purple'    : '#be7ff5 #8f5fb7',
	'grey'      : '#999999 #727272',
	'darkblue'  : '#768cfc #5869bd',
	'lightred'  : '#fc7676 #bd585a',
	'undefined' : '#999999 #727272',
};

for(let color in colors) colors[color] = colors[color].split(" ");

class Polygon {
	constructor(owner, x, y, r, color) {
		this.isTank = false;
		this.isBullet = false;
		this.isSquare = false;
		this.isTriangle = false;
		this.isPentagon = false;
		this.owner = owner;
		this.x = x;
		this.y = y;
		this.r = r;
		this.setColor(color);
		this.angle = Math.random() * 2 * Math.PI; 
		this.points = [];
		this.vectors = [];
		this.moveVector = this.addVector(0, 0, 1000);
		this.repelVector = this.addVector(0, 0, 1500);
		this.floatVector = this.addVector(0, 0, 1000);
		this.meta = {
			health: 100,
			bodyDamage: 2,
			speed: 5
		};
		this.health = 100;
	}
	getSpeed() {
		return this.meta.speed
	}
	getHealth() {
		return this.meta.health
	}
	getBodyDamage() {
		return this.meta.bodyDamage
	}
	setColor(color) {
		this.color = color
		this.fillColor = colors[color][0]
		this.strokeColor = colors[color][1]
	}
	addVector(x, y, decay) {
		let vec = { x, y, decay }
		this.vectors.push(vec)
		return vec
	}
	setVector(i, x, y, decay) {
		if(this.vectors[i]) {
			this.vectors[i].x = x
			this.vectors[i].y = y 
			decay && (this.vectors[i].decay = decay)
		}
	}
	setMoveVector(x, y, decay) {
		this.setVector(0, x, y, decay)
	}
	setRepelVector(x, y, decay) {
		this.setVector(1, x, y, decay)
	}
	setFloatVector(x, y, decay) {
		this.setVector(2, x, y, decay)
	}
	destroy() {
		this.destroyed = true
		this.do = 1
		this.ds = 1
	}
	// **Fix this, you lazy bastard
	float() {
		let angle = Math.random() * 2 * Math.PI 
		let fv = 0.004
		this.setFloatVector(Math.cos(angle) * fv, Math.sin(angle) * fv, 1000)
	}
	spin(deg, ti) {
		!this.spinDir && (this.spinDir = Math.random() > 0.5 ? -1 : 1)
		this.angle += this.spinDir * deg * Math.PI / 180 * dt / ti
		this.angle %= 2 * Math.PI
	}
	move() {
		for(let i = 0; i < this.vectors.length; i++) {
			let vec = this.vectors[i]
			this.x += vec.x * dt
			this.y += vec.y * dt
			if(vec.decay != null && vec.decay > 0) {
				vec.x -= vec.x * dt / vec.decay
				vec.y -= vec.y * dt / vec.decay
			}
		}
	}
	draw(ctx) {
		if(this.destroyed) {
			this.ds = (2 + this.ds * 9) / 10;
			this.do = (0 + this.do * 8) / 10;
			if(this.do < 0.001) return false;
		}	
		ctx.save()
		ctx.translate(this.x, this.y)
		ctx.rotate(this.angle)
		this.destroyed && ctx.scale(this.ds, this.ds)
		this.destroyed && (ctx.globalAlpha = this.do)
		ctx.beginPath();
		if(this.points.length > 0) {
			ctx.moveTo(this.points[0][0] * this.r, this.points[0][1] * this.r);
			for(let j = 1; j < this.points.length; j++) {
				ctx.lineTo(
					this.points[j][0] * this.r, 
					this.points[j][1] * this.r
				);
			}
		} else {
			ctx.arc(0, 0, this.r, 0, 2 * Math.PI);
		}
		ctx.closePath();
		ctx.lineJoin = "round";
		ctx.lineCap = "round";
		ctx.fillStyle = this.destroyed ? this.strokeColor : this.fillColor;
		ctx.strokeStyle = this.strokeColor;
		ctx.lineWidth = 3;
		ctx.fill();
		ctx.stroke();
		ctx.restore()
		if(this.health > 0 && this.health < this.getHealth() && this.isBullet == false) {
			ctx.save()
			let w = Math.min(this.r * 1.7, 43)
			let h = 6
			ctx.translate(this.x - w/2, this.y + this.r + Math.min(this.r, 20))
			progress(ctx, w, h, this.health/this.getHealth())
			ctx.restore()
		}
	}
}

class Triangle extends Polygon {
	constructor(x, y) {
		super(null, x, y, 20, 'lightred')
		this.isTriangle = true
		this.points = trianglePoints
	}
	getBodyDamage() {
		return 2
	}
}

class Square extends Polygon {
	constructor(x, y) {
		super(null, x, y, 20, 'yellow')
		this.isSquare = true
		this.points = squarePoints
	}

}

class Pentagon extends Polygon {
	constructor(x, y, isBigPentagon) {
		super(null, x, y, !isBigPentagon ? 25 : 53, 'darkblue')
		this.isPentagon = true
		this.isBigPentagon = isBigPentagon
		this.points = pentagonPoints
	}
	getBodyDamage() {
		return 10
	}
}

function getPolygonPoints(num) {
	let p = [];
	for(let j = 0; j <= num; j++) {
		let angle = 2 * Math.PI * j / num;
		p.push([Math.cos(angle), Math.sin(angle)]);
	}
	return p;
}

let trianglePoints = getPolygonPoints(3);
let squarePoints = getPolygonPoints(4);
let pentagonPoints = getPolygonPoints(5);

