import urllib.request
import urllib.parse
import re
import time

additional = [
    "Alien Isolation",
    "Tyranny Obsidian",
    "PowerWash Simulator",
    "Spec Ops The Line",
    "Wreckfest",
    "Aliens Fireteam Elite",
    "High on Life",
    "Citizen Sleeper",
    "Road 96",
    "Stranded Alien Dawn",
    "Highfleet",
    "Final Fantasy XVI",
    "Layers of Fear 2023 Bloober",
    "Like a Dragon Ishin",
    "Like a Dragon Gaiden",
    "Wo Long Fallen Dynasty",
    "Hogwarts Legacy",
    "Persona 4 Golden",
    "Catherine Full Body",
    "Yakuza 0",
    "Yakuza Kiwami",
    "Yakuza Kiwami 2",
    "Judgment",
    "Lost Judgment",
    "Danganronpa V3",
    "Zero Time Dilemma",
    "Steins Gate",
    "AI The Somnium Files",
    "Ace Attorney Trilogy",
    "Darkest Dungeon 2 full release",
]

for term in additional:
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
            marker = "OK " if status == 200 else "NO "
            print(f"{marker} {appid:>10} | {name[:55]}")
        else:
            print(f"???            | NOT FOUND: {term}")
    except Exception as e:
        print(f"ERR            | {term}: {str(e)[:40]}")
    time.sleep(0.25)

