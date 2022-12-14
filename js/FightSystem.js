function call(id) {
    blockMainPage();
    unit_data = getFileData(id)
    user_data = getUserData()
    fight_page = window.open('../../html/FightTemplate.html', '_blank')
    let Loop = () => {
        let monster_size = document.getElementById('monster_size').value
        // setup unit info
        let unit_name = fight_page.document.getElementById('unit_name')
        let unit_heal_point = fight_page.document.getElementById('unit_heal_point')
        let unit_asset = fight_page.document.getElementById('unit_asset')
        unit_name.innerHTML = `${unit_data["name"]} <span class="badge text-bg-info">${unit_data['class']}</span> <span class="badge text-bg-success">Count 1</span>`
        unit_heal_point.innerHTML = `${unit_data['heal_point']}`
        unit_asset.src = unit_data['splash_url']
        // setup user info
        let user_heal_point = fight_page.document.getElementById('user_heal_point')
        let user_name = fight_page.document.getElementById('user_name')
        let user_asset = fight_page.document.getElementById('user_asset')
        user_heal_point.innerHTML = `${user_data['heal_point']}`
        user_name.innerHTML = `${user_data["user_name"]} <span class="badge text-bg-info">${user_data['class']}`
        // start fight
        start_fight(monster_size, user_data, unit_data, unit_heal_point, user_heal_point, user_asset, unit_asset, unit_name);    
    }

    fight_page.onload = function() {
        Loop()
    }
}

function getUserData(){
    data = JSON.parse(localStorage.getItem('data'))
    return data['user_data']
}

function getFileData(id){
    var request = new XMLHttpRequest();
    request.open("GET", "../../data/units.json", false)
    request.send(null)
    var file_json = JSON.parse(request.responseText)
    let unit_global_data = file_json['unit_data'][id]
    return unit_global_data
}

function blockMainPage() {
    let inputs = document.getElementsByTagName('input')
    for(let i = 0; i< inputs.length; i++){
        inputs[i].disabled = true
    }
}

function unBlockMainPage() {
    let inputs = document.getElementsByTagName('input')
    for(let i = 0; i< inputs.length; i++){
        inputs[i].disabled = false
    }
}

function start_fight(monster_size, user_data, unit_data, unit_heal_point_obj, user_heal_point_obj, user_asset, unit_asset, unit_name){    
    // setup user info
    let user_heal_point = user_data["heal_point"]
    let user_phisical_damage = user_data["phisical_damage"]
    let user_physical_defence = user_data["physical_defence"]
    let user_crit_chance = user_data["crit_chance"]

    // setup unit info
    let unit_heal_point = unit_data["heal_point"]
    let unit_phisical_damage = unit_data["phisical_damage"]
    let unit_physical_defence = unit_data["physical_defence"]
    let unit_crit_chance = unit_data["crit_chance"]

    let damage_type = "attack"

    //check heal point
    let is_live = (hp) => hp > 0 ? true : false

    let get_random_damage = (damage) => {
        if(damage < 1) { return 1 }
        max = damage + ((Math.abs(damage)*0.025)/0.1)
        min = damage - ((Math.abs(damage)*0.025)/0.1)
        return Math.floor(Math.random() * (max - min)) + min;
    }
 
    let calculate_defence = (damage, defence) => {
        damage = get_random_damage(damage)
        return Math.round(damage*(100/(100+defence)))
    }

    let calculate_crit = (crit, damage) => {
        number = Math.floor(Math.random() * 200)
        if(crit >= number) { 
            damage_type = "crit"
            return damage * 2;
        }
        return 0;
    }

    // generate damage
    let user_damage = () => calculate_defence(user_phisical_damage, unit_physical_defence) + calculate_crit(user_crit_chance, user_phisical_damage) + 0
    let unit_damage = () => calculate_defence(unit_phisical_damage, user_physical_defence) + calculate_crit(unit_crit_chance, unit_phisical_damage) + 0

    // add/remove animation effect
    let addShakingAnimationEffect = (obj, anim_type) => {
        obj.classList.add(anim_type)
        setTimeout(function() {
            obj.classList.remove(anim_type);
        }, 400);
    }

    // make attack
    let attack_user = () => {
        damage_type = "attack"
        current_damage = unit_damage()
        user_heal_point = user_heal_point - current_damage;
        showDamageOnUnit('user', current_damage, damage_type);
        addShakingAnimationEffect(user_asset, "animated");
    }

    let attack_unit = () => {
        damage_type = "attack"
        current_damage = user_damage()
        unit_heal_point = unit_heal_point - current_damage;
        showDamageOnUnit('unit', current_damage, damage_type);
        addShakingAnimationEffect(unit_asset, "animated_unit");
    }

    let update_stats = () => {
        user_heal_point = user_data["heal_point"]
        unit_heal_point = unit_data["heal_point"]
    }

    let monster_count = 1;

    function fightLoop() {     
        setTimeout(function() {   
            attack_user();
            attack_unit();
            setup_hp(user_heal_point_obj, find_percent(user_data["heal_point"], user_heal_point), user_heal_point)
            setup_hp(unit_heal_point_obj, find_percent(unit_data["heal_point"], unit_heal_point), unit_heal_point)
          if (is_live(user_heal_point) && is_live(unit_heal_point)) {
            fightLoop();
          } else if ((!is_live(unit_heal_point) && monster_count != monster_size)) {
                if(monster_count != monster_size) {monster_count++;}
                setTimeout(function() {
                    update_stats();
                    setup_hp(user_heal_point_obj, find_percent(user_data["heal_point"], user_data["heal_point"]), user_data["heal_point"])
                    setup_hp(unit_heal_point_obj, find_percent(unit_data["heal_point"], unit_data["heal_point"]), unit_data["heal_point"])
                    setup_monster_count(unit_name, unit_data, monster_count)
                    fightLoop();
                }, 200);
          } else if (!is_live(user_heal_point)) {
            runLoseResult();
          } else {
            runWinResult();
          }
           
        }, 400)
      }
    fightLoop();
}

function find_percent(max_hp, hp){
 return (hp * 100) / max_hp
}

function setup_hp(obj, hp, current_hp){
    obj.style = `width: ${hp}%`
    if(current_hp < 0) { current_hp = 0}
    obj.innerHTML = "" + Math.round(current_hp)
}

function setup_monster_count(obj, unit_data, count) {
    obj.innerHTML = `${unit_data["name"]} <span class="badge text-bg-info">${unit_data['class']}</span> <span class="badge text-bg-success">Count ${count}</span>`
}

function runWinResult() {
    fight_page.document.getElementById("runWinModal").click();
    let btn = fight_page.document.getElementById('close_page')
    btn.onclick = function() {fight_page.close()};
    unBlockMainPage();
}

function runLoseResult() {
    fight_page.document.getElementById("runLoseModal").click();
    let btn = fight_page.document.getElementById('close_page_1')
    btn.onclick = function() {fight_page.close()};
    unBlockMainPage();
}

function showDamageOnUnit(scope, damage, damageType) {

    let rand_height = (sprite) => {
        position = sprite.getBoundingClientRect()
        min = Math.ceil(position.top);
        max = Math.floor(position.bottom);
        return Math.floor(Math.random() * (max - min)) + min;
    }
    let rand_width = (sprite) => {
        position = sprite.getBoundingClientRect()
        min = Math.ceil(position.left);
        max = Math.floor(position.right);
        return Math.floor(Math.random() * (max - min)) + min;
    }

    if (scope == "user") {
        let user_sprite = fight_page.document.getElementById('user_sprite')
        let el = document.createElement('div');
        el.textContent = ''+damage;
        el.classList.add('slide_bottom')
        if(damageType == "crit"){
            el.style = "position: absolute; color: yellow; font-size: 45px;"
        } else {
            el.style = "position: absolute; color: white; font-size: 25px;"
        }
        el.style.top = rand_height(user_sprite) + "px";
        el.style.left = rand_width(user_sprite) + "px";
        user_sprite.appendChild(el);
        setTimeout(function() {
            el.classList.remove('slide_bottom');
            el.remove();
        }, 1000);
    }

    if (scope == "unit") {
        let unit_sprite = fight_page.document.getElementById('unit_sprite')
        let el = document.createElement('div');
        el.textContent = ''+damage;
        el.classList.add('slide_bottom')
        if(damageType == "crit"){
            el.style = "position: absolute; color: yellow; font-size: 45px;"
        } else {
            el.style = "position: absolute; color: white; font-size: 25px;"
        }
        el.style.top = rand_height(unit_sprite) + "px";
        el.style.left = rand_width(unit_sprite) + "px";
        unit_sprite.appendChild(el);
        setTimeout(function() {
            el.classList.remove('slide_bottom');
            el.remove();
        }, 1000);
    }
}