
let turretParams = "x,y,angle,width,height,spread,baseLength".split(",");

class Turret {
	constructor() {
		this.x = 0
		this.y = 0
		this.width = 1.8
		this.height = 0.8
		this.spread = 0
		this.baseLength = 0
		this.angle = 0
		this.fireAnim = 1
	}
}

class Bullet extends Polygon {
	constructor(owner, x, y, radius, color) {
		super(owner, x, y, radius, color)
		this.isBullet = true
		this.moveVector.decay = 0
		setTimeout(() => {
			this.destroy()
			game.removePolygon(this)
		}, 3500)
		game.addPolygon(this)
	}
	getBodyDamage() {
		return this.owner.getBulletDamage()
	}
	getHealth() {
		return this.owner.getBulletHealth()
	}
}


class Tank extends Polygon {
	constructor(x, y, score, color) {
		super(null, x, y, 23, color)
		this.isTank = true
		this.turrets = [new Turret(this)]
		this.autoSpin = !true
		this.autoFire = false
		this.angle = 0
		this.fireTimer = 0
		this.healthRegenTimer = 0
		this.stats = {
			speed: 0,
			health: 0,
			moveSpeed: 0,
			bulletSpeed: 0,
			bulletDamage: 0,
			reload: 0,
			healthRegen: 0,
			bodyDamage: 0,
			bulletHealth: 0
		}
		this.setScore( score)
		this.recoilVector = this.addVector(0, 0, 1500)
		this.moveVector.decay = 0
		this.moveVector.acc = 0.0004
	}
	setRecoilVector(x, y, decay) {
		this.setVector(3, x, y, decay)
	}
	addTurret(t) {
		this.turrets.push(t)
	}
	loadTurretData(data) {
		this.turrets = []
		data = JSON.parse(data);
		data.forEach(td => {
			let t = new Turret()
			turretParams.forEach(param => {
				t[param] = td[param]
			});
			this.addTurret(t)
		})
	}
	setScore(score) {
		this.score = score
		this.level = 0
		let x = 0
		while(x <= score) {
			this.level++
			x += this.level * this.level
		}
		this.previousScore = x - (this.level - 1) * (this.level - 1)
		this.nextScore = x
		this.radius = this.getRadius()
	}
	getBulletHealth() {
		return 20 + 5 * this.stats.bulletHealth
	}
	getBodyDamage() {
		return 5 + this.stats.bodyDamage
	}
	getRadius() {
		return 18 + Math.sqrt(this.level * 2)
	}
	getHealth() {
		return 100 + 10 * this.stats.health
	}
	getMoveSpeed() {
		return 0.07 + this.stats.moveSpeed * 0.008
	}
	getReload() {
		return 600 - this.stats.reload * 40
	}
	getBulletSpeed() {
		return 0.17 + this.stats.bulletSpeed * 0.04
	}
	getBulletDamage() {
		return 4 + this.stats.bulletDamage
	}
	getHealthRegen() {
		return 16000 - this.stats.healthRegen * 1000
	}
	control(keys) {
		let v = this.getMoveSpeed()
		let dx = 0
		let dy = 0
		if(keys.a) dx = -1;
		else if(keys.d) dx = 1;
		if(keys.w) dy = -1;
		else if(keys.s) dy = 1;

		let base = 0.0004
		let lvlf = Math.min(this.level / 45, 1)
		let thrust = base || base * (1 - lvlf * 0.7)
		let friction = base * (1 + lvlf * 3)

		dx == 0 && (this.moveVector.x -= this.moveVector.x * dt / 500)
		dy == 0 && (this.moveVector.y -= this.moveVector.y * dt / 500)
		this.moveVector.x += dx * thrust * dt
		this.moveVector.y += dy * thrust * dt
		this.moveVector.x = Math.max(-v, Math.min(this.moveVector.x, v))
		this.moveVector.y = Math.max(-v, Math.min(this.moveVector.y, v))
	}
	fireFrom(t) {
		t.fireAnim = 0.5
		let turretBaseAngle = Math.atan2(t.y, t.x);
		let turretBaseDist = Math.hypot(t.x, t.y);
		let turretTopDist = t.width + t.baseLength;
		let x = Math.cos(this.angle + turretBaseAngle) * turretBaseDist + Math.cos(this.angle + t.angle) * turretTopDist;
		let y = Math.sin(this.angle + turretBaseAngle) * turretBaseDist + Math.sin(this.angle + t.angle) * turretTopDist;
		let bullet = new Bullet(this, this.x + x * this.r, this.y + y * this.r, this.r * t.height / 2, this.color);

		let angle = this.angle + t.angle;
		let deflect = Math.PI/18;
			deflect = angle + -deflect + Math.random() * 2 * deflect;
		let v = this.getBulletSpeed();
		let cos = Math.cos(deflect);
		let sin = Math.sin(deflect);
		bullet.moveVector.x = cos * v 
		bullet.moveVector.y = sin * v

		let vRecoil = Math.hypot(this.moveVector.x, this.moveVector.y) * 2
		bullet.addVector(cos * vRecoil, sin * vRecoil, 100)
		bullet.health = this.getBulletHealth()
		v = Math.min(v * 0.1, this.getMoveSpeed() * 0.4)
		this.setRecoilVector(-cos * v, -sin * v)
	}
	fire() {
		if(this.fireTimer < this.getReload()) return false
		else this.fireTimer = 0
		let len = this.turrets.length
		let ti = this.getReload() / len
		let used = []
		while(used.length < len) {
			let t = this.turrets[Math.floor(Math.random() * len)]
			if(used.indexOf(t) > -1) continue
			setTimeout(() => this.fireFrom(t), ti * used.length)
			used.push(t)
		}
	}
	update() {
		this.getReload() >= this.fireTimer && (this.fireTimer += dt)
		this.autoSpin && this.spin(1, 10)
		this.autoFire && this.fire()
		if(this.getHealthRegen() >= this.healthRegenTimer) {
			this.healthRegenTimer += dt
		} else if(this.health < this.getHealth()) {
			this.health += this.getHealth() * dt / 5000
			this.health = Math.min(this.getHealth(), this.health)
		}
		this.move()
	}
	draw(ctx) {
		for(let i = 0; i < this.turrets.length; i++) {
			let t = this.turrets[i];
			t.fireAnim = (1 * 1 + t.fireAnim * 9) / 10;

			let x = 4 * Math.sin(2 * Math.PI * t.fireAnim);
			let lw = 3;
			let f = this.r;
			ctx.fillStyle = colors['grey'][0]
			ctx.strokeStyle = colors['grey'][1]
			ctx.lineWidth = lw
			ctx.save()
			ctx.translate(this.x, this.y)
			ctx.rotate(this.angle + t.angle)
			if(tank.destroyed) {
				ctx.globalAlpha = tank.do
				ctx.scale(tank.ds, tank.ds)
				ctx.fillStyle = ctx.strokeStyle
			}
			ctx.translate(x, 0)
			ctx.translate(t.x * f, t.y * f)
			ctx.fillRect(0, -t.height / 2 * f, t.baseLength * f, t.height * f)
			ctx.strokeRect(0, -t.height / 2 * f, t.baseLength * f , t.height * f)	
			ctx.translate(t.baseLength * f, 0)
			ctx.beginPath()
			ctx.moveTo(0, -t.height / 2 * f)
			ctx.lineTo(t.width * f, -t.height / 2 * f - t.spread / 2 * f)
			ctx.lineTo(t.width * f, t.height / 2 * f + t.spread / 2 * f)
			ctx.lineTo(0, t.height / 2 * f)
			ctx.lineTo(0, 0)
			ctx.closePath()
			ctx.fill()
			ctx.stroke()
			ctx.restore()
		}
		Polygon.prototype.draw.apply(this, arguments);
	}
}













