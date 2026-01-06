import subprocess
import os
from pathlib import Path

print('🚀 ESTRAZIONE PROGETTO TOWER HYBRID GAME')
print('=' * 60)

# Percorso del file .bundle
bundle_file = Path.home() / 'Downloads' / 'Tower-Hybrid-Game.bundle'
project_dir = Path.home() / 'Projects' / 'Tower-Hybrid-Game'

if not bundle_file.exists():
    print(f'❌ File non trovato: {bundle_file}')
    print('Assicurati di aver scaricato Tower-Hybrid-Game.bundle')
    exit(1)

print(f'✅ File trovato: {bundle_file}')
print(f'📁 Cartella destinazione: {project_dir}')

# Crea la cartella del progetto
project_dir.mkdir(parents=True, exist_ok=True)
print(f'✓ Cartella creata')

# Cambia directory
os.chdir(project_dir)
print(f'✓ Directory: {os.getcwd()}')

# Comando Git per estrarre il bundle
print('\n🔄 Estrazione repository Git...')
cmds = [
    f'git init',
    f'git remote add origin "{bundle_file}"',
    f'git fetch origin',
    f'git checkout -b main origin/main || git checkout -b main origin/HEAD',
    f'git config user.email "local@dev"',
    f'git config user.name "Local Dev"',
]

for cmd in cmds:
    print(f'  > {cmd}')
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f'  ⚠️  {result.stderr[:100]}')
    else:
        print(f'  ✓')

print(f'\n🎉 PROGETTO ESTRATTO CON SUCCESSO!')
print(f'\n📖 Prossimi step:')
print(f'  1. Apri VS Code')
print(f'  2. File → Open Folder')
print(f'  3. Seleziona: {project_dir}')
print(f'  4. Apri terminale (Ctrl+`)')
print(f'  5. Digita: npm install')
print(f'  6. Poi: npm run dev')
print(f'\n✨ Pronto!')
