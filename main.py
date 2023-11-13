@namespace
class SpriteKind:
    enemy_projectile = SpriteKind.create()

# variables
deceleration = 0.9
player_speed = 20
enemy_shot_speed = 70
enemy_placements = []
wave_timer = 5000

# sprites
ship = sprites.create(assets.image("ship"), SpriteKind.player)
ship.y = 108
ship.z = 5
ship.set_stay_in_screen(True)
formation_center = sprites.create(assets.image("empty"))
formation_center.set_position(80, 60)
formation_center.set_bounce_on_wall(True)
formation_center.set_velocity(randint(-10, 10), randint(-10, 10))

# setup
info.set_life(3)
info.set_score(0)

# game loop and events
spawn_space_dust()
spawn_wave()

def spawn_space_dust():
    dust = sprites.create(assets.image("space dust"))
    dust.set_flag(SpriteFlag.AUTO_DESTROY, True)
    dust.set_position(randint(0, 160), 0)
    dust.set_scale(randint(0.05, 0.15), ScaleAnchor.MIDDLE)
    dust.vy = randint(40, 50)
    timer.after(randint(250, 500), spawn_space_dust)

def set_offset(enemy: Sprite):
    x_offset = randint(-4, 4) * 16
    y_offset = randint(-3, 1) * 16
    sprites.set_data_number(enemy, "x_offset", x_offset)
    sprites.set_data_number(enemy, "y_offset", y_offset)

def spawn_enemy(start_x, start_y, speed):
    enemy = sprites.create(assets.image("enemy ship 1"), SpriteKind.enemy)
    if randint(1, 2) == 2:
        enemy.set_image(assets.image("enemy ship 2"))
    enemy.set_position(start_x, start_y)
    sprites.set_data_number(enemy, "t", 0)
    sprites.set_data_number(enemy, "speed", speed)
    sprites.set_data_number(enemy, "fire_chance", 250)
    set_offset(enemy)

def spawn_wave():
    start_side = randint(0, 1)
    if start_side == 0:
        start_x = 0
    else: 
        start_x = 160
    start_y = randint(0, 90)
    for i in range(randint(3, 6)):
        spawn_enemy(start_x, start_y, 0.001)
        pause(200)
    timer.after(wave_timer, spawn_wave)

def decrease_wave_timer():
    global wave_timer
    wave_timer *= 0.9
game.on_update_interval(15000, decrease_wave_timer)

def destroy_enemy(projectile, enemy):
    info.change_score_by(100)
    projectile.destroy()
    enemy.destroy(effects.disintegrate)
sprites.on_overlap(SpriteKind.projectile, SpriteKind.enemy, destroy_enemy)

def player_hit(player, enemy):
    info.change_life_by(-1)
    enemy.destroy()
sprites.on_overlap(SpriteKind.player, SpriteKind.enemy, player_hit)
sprites.on_overlap(SpriteKind.player, SpriteKind.enemy_projectile, player_hit)

def player_fire():
    sprites.create_projectile_from_sprite(assets.image("player projectile"), ship, 0, -100)
controller.A.on_event(ControllerButtonEvent.PRESSED, player_fire)

def player_movement():
    if controller.left.is_pressed():
        ship.vx -= player_speed
    if controller.right.is_pressed():
        ship.vx += player_speed
    ship.vx *= deceleration

def lerp(start_position, end_position, t):
    return start_position + t * (end_position - start_position)

def enemy_fire(enemy: Sprite):
    projectile = sprites.create(assets.image("enemy projectile"), SpriteKind.enemy_projectile)
    projectile.set_position(enemy.x, enemy.y)
    projectile.set_flag(SpriteFlag.AUTO_DESTROY, True)
    projectile.vy = enemy_shot_speed
    music.pew_pew.play()

def update_enemy_position(enemy: Sprite, formation_center: Sprite):
    t = sprites.read_data_number(enemy, "t")
    x_offset = sprites.read_data_number(enemy, "x_offset")
    y_offset = sprites.read_data_number(enemy, "y_offset")
    enemy.x = lerp(enemy.x, formation_center.x + x_offset, t)
    enemy.y = lerp(enemy.y, formation_center.y + y_offset, t)
    if t != 1:
        t += sprites.read_data_number(enemy, "speed")
        sprites.set_data_number(enemy, "t", t)
        if t > 1:
            sprites.set_data_number(enemy, "t", 1)

def constrain_formation_position():
    if formation_center.x < 70:
        formation_center.vx = randint(5, 10)
    if formation_center.x > 90:
        formation_center.vx = randint(-5, -10)
    if formation_center.y < 55:
        formation_center.vy = randint(5, 10)
    if formation_center.y > 65:
        formation_center.vy = randint(-5, -10)

def tick():
    player_movement()
    for enemy in sprites.all_of_kind(SpriteKind.enemy):
        fire_chance = sprites.read_data_number(enemy, "fire_chance")
        if randint(0, fire_chance) == fire_chance:
            enemy_fire(enemy)
        update_enemy_position(enemy, formation_center)
    constrain_formation_position()
game.on_update(tick)
