import urllib.request
import urllib.parse
import re
import time

games_to_find = [
    # Classic Action/RPG
    "BioShock Infinite",
    "BioShock 2 Remastered",
    "Deus Ex Human Revolution Director's Cut",
    "Deus Ex Mankind Divided",
    "System Shock Remake",
    "Max Payne 3",
    "Sleeping Dogs Definitive Edition",
    "Spec Ops The Line",
    "Quantum Break",
    "STALKER 2 Heart of Chornobyl",
    # RPG Classics
    "Pillars of Eternity",
    "Solasta Crown of the Magister",
    "Pathfinder Kingmaker",
    "Tyranny",
    "Torment Tides of Numenera",
    "Neverwinter Nights Enhanced Edition",
    "Baldur's Gate Enhanced Edition",
    "Baldur's Gate II Enhanced Edition",
    "ATOM RPG",
    "Encased A Sci-Fi Post-Apocalyptic RPG",
    # Horror
    "Alien Isolation",
    "Observer System Redux",
    "Martha Is Dead",
    "Scorn",
    "Layers of Fear 2023",
    "Mundaun",
    "The Quarry",
    "Dark Pictures House of Ashes",
    "Dark Pictures Man of Medan",
    "Maid of Sker",
    # Simulation
    "Cities Skylines 2",
    "PowerWash Simulator",
    "House Flipper 2",
    "Car Mechanic Simulator 2021",
    "PC Building Simulator 2",
    "Farming Simulator 25",
    "My Time at Sandrock",
    "Coral Island",
    "Stardew Valley 1.6",
    "Terra Nil",
    # Strategy
    "Company of Heroes 3",
    "Homeworld 3",
    "Bad North",
    "Dorfromantik",
    "Terra Nil",
    "Norco",
    "Hardspace Shipbreaker",
    "The Riftbreaker",
    "Rogue Trader Warhammer 40000",
    "Battlefleet Gothic Armada 2",
    # Survival
    "Icarus",
    "Generation Zero",
    "Smalland Survive the Wilds",
    "Dysmantle",
    "The Wild Eight",
    "Volcanoids",
    "SCUM",
    "7 Days to Die",
    "Conan Exiles",
    "Myth of Empires",
    # Racing
    "Assetto Corsa",
    "Assetto Corsa Competizione",
    "WRC Generations",
    "Forza Motorsport 2023",
    "Wreckfest",
    "GRID Legends",
    "Ride 5",
    "MotoGP 24",
    "FlatOut 4",
    "Dakar Desert Rally",
    # Fighting
    "Mortal Kombat X",
    "The King of Fighters XV",
    "Guilty Gear Xrd REV 2",
    "Samurai Shodown",
    "Under Night In-Birth II",
    "Granblue Fantasy Versus Rising",
    "DNF Duel",
    "MultiVersus",
    "For Honor",
    "Naraka Bladepoint",
    # Indie/Roguelike
    "Deaths Door",
    "A Hat in Time",
    "Psychonauts 2",
    "Kena Bridge of Spirits",
    "Skul The Hero Slayer",
    "Haiku the Robot",
    "Ghost Song",
    "Laika Aged Through Blood",
    "Aeterna Noctis",
    "Record of Lodoss War Deedlit",
    # 2024 titles
    "Like a Dragon Infinite Wealth",
    "Granblue Fantasy Relink",
    "Final Fantasy VII Rebirth",
    "Senua's Saga Hellblade II",
    "Elden Ring Shadow of the Erdtree",
    "Black Myth Wukong",
    "Warhammer 40000 Space Marine 2",
    "Silent Hill 2 Remake",
    "Astro Bot",
    "Concord PlayStation",
]

found = {}
failed = []

for term in games_to_find:
    url = f"https://store.steampowered.com/search/suggest?term={urllib.parse.quote(term)}&f=games&cc=US&l=en"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=8) as r:
            data = r.read().decode("utf-8")
        ids = re.findall(r'data-ds-appid="(\d+)"', data)
        names = re.findall(r'class="match_name">([^<]+)', data)
        if ids and names:
            appid = int(ids[0])
            name = names[0].strip()
            img_url = f"https://cdn.cloudflare.steamstatic.com/steam/apps/{appid}/header.jpg"
            try:
                img_req = urllib.request.Request(img_url, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(img_req, timeout=8) as r2:
                    status = r2.status
            except Exception:
                status = 0
            found[term] = (appid, name, status)
            marker = "OK " if status == 200 else "NO "
            print(f"{marker} {appid:>10} | {name[:55]}")
        else:
            failed.append(term)
            print(f"???            | NOT FOUND: {term}")
    except Exception as e:
        failed.append(term)
        print(f"ERR            | {term}: {str(e)[:40]}")
    time.sleep(0.25)

print(f"\n=== VERIFIED OK ({sum(1 for v in found.values() if v[2]==200)}) ===")
for term, (appid, name, status) in found.items():
    if status == 200:
        print(f"  {appid}: {name}")

print(f"\n=== FAILED IMAGE ({sum(1 for v in found.values() if v[2]!=200)}) ===")
for term, (appid, name, status) in found.items():
    if status != 200:
        print(f"  {appid}: {name} -> {status}")

