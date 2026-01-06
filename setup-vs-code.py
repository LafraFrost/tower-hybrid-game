import os
import shutil
import tarfile
from pathlib import Path

# Step 1: Find the tar.gz file in Download
downloads_path = Path.home() / 'Downloads' / 'Tower-Hybrid-Game.tar.gz'

if not downloads_path.exists():
    print(f'❌ File non trovato: {downloads_path}')
    print('📥 Assicurati di aver scaricato Tower-Hybrid-Game.tar.gz da Replit')
    exit(1)

print('✅ File trovato!')

# Step 2: Create project folder
project_path = Path.home() / 'Projects' / 'Tower-Hybrid-Game'
project_path.mkdir(parents=True, exist_ok=True)

print(f'📁 Cartella progetto: {project_path}')

# Step 3: Extract tar.gz
print('📦 Estraggo i file...')
with tarfile.open(downloads_path, 'r:gz') as tar:
    tar.extractall(path=project_path)

print('✅ File estratti!')

# Step 4: Remove node_modules and .git if present
for folder_to_remove in ['node_modules', '.git']:
    folder_path = project_path / folder_to_remove
    if folder_path.exists():
        shutil.rmtree(folder_path)
        print(f'🗑️  Rimosso: {folder_to_remove}')

print(f'\n🎉 Progetto pronto in: {project_path}')
print('\n📝 Prossimi passi:')
print(f'1. Apri VS Code')
print(f'2. File → Open Folder')
print(f'3. Seleziona: {project_path}')
print(f'4. Apri il terminale (Ctrl+`) e digita: npm install')
print(f'5. Poi digita: npm run dev')
