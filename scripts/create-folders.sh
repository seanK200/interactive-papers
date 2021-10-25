if [[ $# -lt 2 ]]; then
    echo "Error: Missing arguments\n"
    echo "Usage: create-folders.sh [reference dirname] [new dirname]"
else
    mkdir ../docs/$2
    find ../docs/$1 -type d -depth 1 -exec basename {} \; | xargs -I {} mkdir ../docs/$2/{}
    find ../docs/$2 -type d -depth 1 -exec cp ../docs/template/index.html {} \;
fi