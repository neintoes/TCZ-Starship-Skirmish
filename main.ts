namespace SpriteKind {
    export const enemy_projectile = SpriteKind.create()
}

//  variables
let deceleration = 0.9
let player_speed = 20
let enemy_shot_speed = 70
let enemy_placements = []
let wave_timer = 5000
//  sprites
let ship = sprites.create(assets.image`ship`, SpriteKind.Player)
ship.y = 108
ship.z = 5
ship.setStayInScreen(true)
let formation_center = sprites.create(assets.image`empty`)
formation_center.setPosition(80, 60)
formation_center.setBounceOnWall(true)
formation_center.setVelocity(randint(-10, 10), randint(-10, 10))
//  setup
info.setLife(3)
info.setScore(0)
//  game loop and events
spawn_space_dust()
spawn_wave()
function spawn_space_dust() {
    let dust = sprites.create(assets.image`space dust`)
    dust.setFlag(SpriteFlag.AutoDestroy, true)
    dust.setPosition(randint(0, 160), 0)
    dust.setScale(randint(0.05, 0.15), ScaleAnchor.Middle)
    dust.vy = randint(40, 50)
    timer.after(randint(250, 500), spawn_space_dust)
}

function set_offset(enemy: Sprite) {
    let x_offset = randint(-4, 4) * 16
    let y_offset = randint(-3, 1) * 16
    sprites.setDataNumber(enemy, "x_offset", x_offset)
    sprites.setDataNumber(enemy, "y_offset", y_offset)
}

function spawn_enemy(start_x: number, start_y: number, speed: number) {
    let enemy = sprites.create(assets.image`enemy ship 1`, SpriteKind.Enemy)
    if (randint(1, 2) == 2) {
        enemy.setImage(assets.image`enemy ship 2`)
    }
    
    enemy.setPosition(start_x, start_y)
    sprites.setDataNumber(enemy, "t", 0)
    sprites.setDataNumber(enemy, "speed", speed)
    sprites.setDataNumber(enemy, "fire_chance", 250)
    set_offset(enemy)
}

function spawn_wave() {
    let start_x: number;
    let start_side = randint(0, 1)
    if (start_side == 0) {
        start_x = 0
    } else {
        start_x = 160
    }
    
    let start_y = randint(0, 90)
    for (let i = 0; i < randint(3, 6); i++) {
        spawn_enemy(start_x, start_y, 0.001)
        pause(200)
    }
    timer.after(wave_timer, spawn_wave)
}

game.onUpdateInterval(15000, function decrease_wave_timer() {
    
    wave_timer *= 0.9
})
sprites.onOverlap(SpriteKind.Projectile, SpriteKind.Enemy, function destroy_enemy(projectile: Sprite, enemy: Sprite) {
    info.changeScoreBy(100)
    projectile.destroy()
    enemy.destroy(effects.disintegrate)
})
function player_hit(player: Sprite, enemy: Sprite) {
    info.changeLifeBy(-1)
    enemy.destroy()
}

sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, player_hit)
sprites.onOverlap(SpriteKind.Player, SpriteKind.enemy_projectile, player_hit)
controller.A.onEvent(ControllerButtonEvent.Pressed, function player_fire() {
    sprites.createProjectileFromSprite(assets.image`player projectile`, ship, 0, -100)
})
function player_movement() {
    if (controller.left.isPressed()) {
        ship.vx -= player_speed
    }
    
    if (controller.right.isPressed()) {
        ship.vx += player_speed
    }
    
    ship.vx *= deceleration
}

function lerp(start_position: number, end_position: number, t: number): number {
    return start_position + t * (end_position - start_position)
}

function enemy_fire(enemy: Sprite) {
    let projectile = sprites.create(assets.image`enemy projectile`, SpriteKind.enemy_projectile)
    projectile.setPosition(enemy.x, enemy.y)
    projectile.setFlag(SpriteFlag.AutoDestroy, true)
    projectile.vy = enemy_shot_speed
    music.pewPew.play()
}

function update_enemy_position(enemy: Sprite, formation_center: Sprite) {
    let t = sprites.readDataNumber(enemy, "t")
    let x_offset = sprites.readDataNumber(enemy, "x_offset")
    let y_offset = sprites.readDataNumber(enemy, "y_offset")
    enemy.x = lerp(enemy.x, formation_center.x + x_offset, t)
    enemy.y = lerp(enemy.y, formation_center.y + y_offset, t)
    if (t != 1) {
        t += sprites.readDataNumber(enemy, "speed")
        sprites.setDataNumber(enemy, "t", t)
        if (t > 1) {
            sprites.setDataNumber(enemy, "t", 1)
        }
        
    }
    
}

function constrain_formation_position() {
    if (formation_center.x < 70) {
        formation_center.vx = randint(5, 10)
    }
    
    if (formation_center.x > 90) {
        formation_center.vx = randint(-5, -10)
    }
    
    if (formation_center.y < 55) {
        formation_center.vy = randint(5, 10)
    }
    
    if (formation_center.y > 65) {
        formation_center.vy = randint(-5, -10)
    }
    
}

game.onUpdate(function tick() {
    let fire_chance: number;
    player_movement()
    for (let enemy of sprites.allOfKind(SpriteKind.Enemy)) {
        fire_chance = sprites.readDataNumber(enemy, "fire_chance")
        if (randint(0, fire_chance) == fire_chance) {
            enemy_fire(enemy)
        }
        
        update_enemy_position(enemy, formation_center)
    }
    constrain_formation_position()
})
