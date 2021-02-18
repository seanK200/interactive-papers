/*
    [ADVANCED]
    FUNCTION "changeStyle"
    This is a helper function to deal with bootstrap.js styling.
    (Prior knowledge of bootstrap.js is needed to understand this function. Not necessary)

    It looks for any pre-defined values within the class attribute of the target element.
    If found, the value will be replaced. If not found, it will be newly inserted.
*/
function changeStyle(targetElement, newValue) {
    console.log(`changeStyle(${targetElement}, ${newValue})`)
    const oldClassName = targetElement.className.split(' ');
    let newClassName = '';

    let predefined = false;
    oldClassName.forEach((oldValue, index) => {
        if (oldValue.split('-')[0] === newValue.split('-')[0]) {
            newClassName += newValue;
            predefined = true;
        } else {
            newClassName += oldValue;
        }

        if(index < oldClassName.length - 1) newClassName += ' ';
    });
    if(!predefined) newClassName += newValue;
    targetElement.className = newClassName;
}

function removeStyle(targetElement, originalValue) {
    console.log(`removeStyle(${targetElement}, ${originalValue})`)
    const oldClassName = targetElement.className.split(' ');
    let newClassName = '';

    oldClassName.forEach((oldValue, index) => {
        if(oldValue !== originalValue) {
            newClassName += oldValue;
        }
    });

    targetElement.className = newClassName;
}


/*
    FUNCTION "initializeApp"
    This is the first function that runs as soon as the page has loaded
*/
function initializeApp() {
    // processAnnotations();
    // processFootnotes();
    const form = document.getElementById('content-select-form');
    form.addEventListener('submit', handleContentLoadFormSubmit);
}

//Calling the function initializeApp as soon as the webpage(window) has loaded
window.onload = initializeApp;

/* 
    FUNCTION "processAnnotations"
    This processes footnote markers to add necessary data attributes automatically.
    
    This allows the user to just type '<a>[1]</a>' to add an interactive footnote marker, 
    instead of typing out
    '<a class="footnote" data-ip-footnote-id="[1]]" onclick="handleFootnoteClick(this)">[1]</a>'
    every time when creating a footnote within the content.
*/
function processAnnotations() {
    //look for all '<a></a>' tags within the content
    let annotations = document.getElementById('content-div').getElementsByTagName('a');
    for(let i=0; i<annotations.length; i++) {
        /* 
            This code only processes the <a> tags without a href attribute as a footnote
            This means you can still use '<a href="www.some_external_url.com"></a>' 
            if you want to add external links to your document.
        */

        // Check if the '<a>' tag has no href attribute
        if(annotations[i].getAttribute('href') === null || annotations[i].getAttribute('href') === '') {
            // add the click handler
            annotations[i].setAttribute('onclick', 'handleFootnoteClick(this)');

            // if class is not specified, add the class of footnote
            if(annotations[i].getAttribute('class')===null) {
                annotations[i].setAttribute('class', 'footnote')
            }

            // set the data-ip-footnote-id if not explicitly specified as the text between the <a> tags
            if(annotations[i].getAttribute('data-ip-footnote-id') === null) {
                annotations[i].setAttribute('data-ip-footnote-id', annotations[i].innerText);
            }
        }
    }
}
/* 
    FUNCTION "processFootnotes"
    This processes footnote markers to add necessary data attributes automatically.
    
    This allows the user to just type '<div class="footnote" id="[1]]"></div>' 
    to create a footnote, instead of typing out
    '<div class="footnote" id="[1]"><div class="footnote-name">[1]</div></div>'
    every time when creating a footnote in the footnotes div.
*/
function processFootnotes() {
    let footnotes = document.getElementById('footnotes-div').getElementsByClassName('footnote');
    for (let i=0; i<footnotes.length; i++) {
        const footnoteIdDiv = document.createElement('div');
        const footnoteIdContent = document.createTextNode(footnotes[i].getAttribute('id'));
        footnoteIdDiv.setAttribute('class', 'footnote-name');
        footnoteIdDiv.appendChild(footnoteIdContent);
        footnotes[i].insertBefore(footnoteIdDiv, footnotes[i].firstChild);
        footnotes[i].setAttribute('onclick', 'handleFootnoteDivClick(this)');
    }
}

/* */
async function processImages(contentName) {
    const images = document.getElementsByTagName('img');
    const srcUrlPrefix = 'docs/' + contentName + "/"
    for(let i=0; i<images.length; i++) {
        const old_src = images[i].getAttribute('src');
        if(old_src.split('/')[0] !=='docs/' && old_src.split('/')[0] !=='assets/') {
            const new_src = srcUrlPrefix + old_src;
            images[i].setAttribute('src', new_src);
            console.log(`processImages oldSrc=${old_src}, newSrc=${new_src}`)
        }
    }
}

function fetchContent(contentName) {
    document.getElementById('content-div').innerHTML = '';
    let urlPrefix = 'docs/' + contentName + '/';
    $.ajax({
        url: urlPrefix + 'content.html',
        cache: false,
        dataType: 'html',
    })
    .done(async function(html) {
        await $('#content-div').append(html);
        processAnnotations();
        processImages(contentName);
    })
    .fail(function (jqXHR, textStatus) {
        // alert("Could not find the content you are looking for. (" + textStatus + ")");
        $('#content-div').append("Could not find the content file you are looking for.  /  ");
        new Error('ContentNotFound');
    })
}

function fetchFootnotes(contentName) {
    document.getElementById('footnotes-div').innerHTML = '';
    let urlPrefix = 'docs/' + contentName + '/';
    $.ajax({
        url: urlPrefix + 'footnotes.html',
        cache: false,
        dataType: 'html',
    })
    .done(async function(html) {
        await $('#footnotes-div').append(html);
        processFootnotes();
        processImages(contentName);
    })
    .fail(function (jqXHR, textStatus) {
        // alert("Could not find the content you are looking for. (" + textStatus + ")");
        $('#content-div').append("Could not find the footnote file you are looking for.  /  ");
        new Error('FootnoteNotFound');
    })
}

function setContentAttributes(contentName) {
    const contentDiv = document.getElementById('content-div');
    const readLink = document.getElementById('nav-read-link');
    
    contentDiv.setAttribute('data-ip-current-content', contentName);
    if(contentName !== 'help') readLink.setAttribute('data-ip-prev-content', contentName);
    if(contentName === '') {
        changeStyle(readLink, 'disabled');
    } else {
        if(contentName !== 'help') removeStyle(readLink, 'disabled');
    }
}

const handleContentLoadFormSubmit = (e=null) => {
    if(e!==null) e.preventDefault();
    let contentName = document.getElementById('content_input').value;
    if(validateContentLoadForm()) {
        try {
            fetchContent(contentName);
            fetchFootnotes(contentName);
            setContentAttributes(contentName);
        } catch (error) {
            console.log(error.name + ': ' + error.message);
        }
    }
}

const validateContentLoadForm = () => {
    const contentName = document.getElementById('content_input').value;
    let validated = true;
    if(typeof contentName === 'undefined' || contentName === null || contentName === '') {
        validated = false;
    }
    if(contentName.split(' ').length > 1) {
        validated = false;
    }
    return validated;
}

/*
    FUNCTION "handleFootnoteClick"
    This function 'handles' clicks on a footnote.

    When a user clicks on an interactive footnote marker within the content,
    it looks for a footnote with that id in the footnotes section,
    and populates the footnote viewer with the correct content
*/
function handleFootnoteClick(footnoteElement) {
    // getting the id of the footnote that was clicked
    const footnoteId = footnoteElement.getAttribute('data-ip-footnote-id');

    if(footnoteId === null || footnoteId === '') {
        // check if that id is empty, or not specified
        alert("[ERROR] A 'data-ip-footnote-id' attribute of a footnote link(<a>) tag cannot be left empty. Remove the attribute entirely if you are not using it.");
    } else {
        //if everything is okay, 

        //look for the footnote that has the id of the footnote that was clicked
        const footnoteContent = document.getElementById(footnoteId).innerHTML;

        //Populate the footnote viewer with the found content
        document.getElementById('footnote-viewer').innerHTML = footnoteContent;
        
        //set multiple footnotes actions div
        setFootnoteActionsMultipleDiv(footnoteElement);

        //Finally, display the footnote viewer if it was closed by the user
        document.getElementById('footnote-viewer-container').style.display = 'flex';
    }
}

/*
    FUNCTION "handleCloseFootnoteViewerClick"
    This function 'handles' a click on the close button (x) in the footnote viewer.
*/
function handleCloseFootnoteViewerClick() {
    //hide the footnote viewer
    // changeStyle(document.getElementById("footnote-viewer-container"), 'd-none')
    document.getElementById("footnote-viewer-container").style.display = 'none';
}


function getFootnotesById(footnoteId, returnIndexes=false) {
    const footnotes = document.getElementById('content-div').getElementsByTagName("a");
    let foundFootnotes = [];
    let foundFootnoteIndexes = [];
    for (let i=0; i<footnotes.length; i++) {
        if(footnotes[i].getAttribute('data-ip-footnote-id') === footnoteId) {
            footnotes[i].setAttribute('data-ip-same-footnote-index', foundFootnotes.length);
            foundFootnotes.push(footnotes[i]);
            foundFootnoteIndexes.push(i);
        }
    }
    if(footnotes.length === 0) return returnIndexes ? [null, null] : null;
    return returnIndexes ? [foundFootnotes, foundFootnoteIndexes] : foundFootnotes;
}

function getFirstFootnoteById(footnoteId) {
    const footnotes = document.getElementById('content-div').getElementsByTagName("a");
    for (let i=0; i<footnotes.length; i++) {
        if(footnotes[i].getAttribute('data-ip-footnote-id') === footnoteId) {
            return footnotes[i];
        }
    }
    return null;
}

function setFootnoteActionsMultipleDiv(selectedFootnoteElement) {
    const footnoteId = selectedFootnoteElement.getAttribute('data-ip-footnote-id')!==null ? selectedFootnoteElement.getAttribute('data-ip-footnote-id') : selectedFootnoteElement.getAttribute('id')
    const [foundFootnotes, foundFootnoteIndexes] = getFootnotesById(footnoteId, true);
    if(foundFootnotes !== null) {
        if(foundFootnotes.length > 1) {
            let current_same_index = selectedFootnoteElement.getAttribute('data-ip-same-footnote-index');
            if(current_same_index !== null && current_same_index !== 'null') current_same_index = parseInt(current_same_index);
            const prev_same_index = (current_same_index > 0) ? current_same_index - 1 : null;
            const prev_index = (prev_same_index === null) ? null : foundFootnoteIndexes[prev_same_index];
            const next_same_index = (current_same_index < foundFootnotes.length - 1) ? current_same_index + 1 : null;
            const next_index = (next_same_index === null) ? null : foundFootnoteIndexes[next_same_index];
            console.log(current_same_index, prev_same_index, prev_index, next_same_index, next_index);

            // set prev btn attributes
            document.querySelector('div#footnote-actions-multiple #prev-btn').setAttribute('data-ip-prev-footnote-index', prev_index);

            // set current span
            document.querySelector('div#footnote-actions-multiple span#current').innerHTML = parseInt(current_same_index) + 1;

            // total span
            document.querySelector('div#footnote-actions-multiple span#total').innerHTML = foundFootnotes.length;

            // next btn
            document.querySelector('div#footnote-actions-multiple #next-btn').setAttribute('data-ip-next-footnote-index', next_index);

            document.querySelector('div#footnote-actions-multiple').style.display = 'block';
        } else {
            document.querySelector('div#footnote-actions-multiple').style.display = 'none';
        }
    }
}

function highlightElement(selectedElement) {
    // let elementLocation = selectedElement.offsetTop - document.getElementById('content-div').offsetTop - Math.floor(window.innerHeight / 2);
    // let highlightLocation = 0;
    // if (elementLocation >= 0) {
    //     // at middle of the screen
    //     highlightLocation = Math.floor(window.innerHeight / 2)
    // } else {
    //     highlightLocation = selectedElement.offsetTop - document.getElementById('content-div').scrollTop;
    // }
    let highlightLocation = selectedElement.offsetTop - 3;
    let highlighter = document.createElement('div');
    highlighter.setAttribute('class', 'temporary-highlighter');
    highlighter.style.top = highlightLocation + 'px';
    document.getElementById('content-div').append(highlighter);
    console.log(highlighter);
    console.log(document.querySelector('.temporary-highlighter'));
    // setTimeout(() => { document.querySelector('.temporary-highlighter').remove(); }, 2100);
}

function scrollFootnoteIntoView(footnoteElement) {
    let location = footnoteElement.offsetTop - document.getElementById('content-div').offsetTop - Math.floor(window.innerHeight / 3);
    // let location = footnoteElement.offsetTop - Math.floor(window.innerHeight / 3);
    if (location < 0) location = 0;
    document.getElementById('content-div').scrollTo(0, location);
    window.scrollTo(0,0);
    // window.scrollTo(0, location);
    highlightElement(footnoteElement);
}

function handlePreviousSameFootnoteClick(prevBtn) {
    const footnotes = document.getElementById('content-div').getElementsByTagName("a")
    let prev_index = prevBtn.getAttribute('data-ip-prev-footnote-index');
    if(prev_index !== 'null') {
        prev_index = parseInt(prev_index);
        scrollFootnoteIntoView(footnotes[prev_index])
        handleFootnoteClick(footnotes[prev_index]);
    }
}

function handleNextSameFootnoteClick(nextBtn) {
    const footnotes = document.getElementById('content-div').getElementsByTagName("a")
    let next_index = nextBtn.getAttribute('data-ip-next-footnote-index');
    if(next_index !== 'null') {
        next_index = parseInt(next_index);
        scrollFootnoteIntoView(footnotes[next_index])
        handleFootnoteClick(footnotes[next_index]);
    }
}

function handleFootnoteDivClick(fnElement) {
    let foundFootnote = getFirstFootnoteById(fnElement.getAttribute('id'));
    handleFootnoteClick(foundFootnote);
    scrollFootnoteIntoView(foundFootnote);
}

function gotoContent(contentName) {
    const contentInput = document.getElementById('content_input');
    if(contentName !== null && contentName !== '') {
        contentInput.value = contentName;
        handleContentLoadFormSubmit();
    }
}

function handleReadClick() {
    const prevContent = document.getElementById('nav-read-link').getAttribute('data-ip-prev-content');
    const currentContent = document.getElementById('content-div').getAttribute('data-ip-current-content');
    console.log(`handleReadClick() prevContent=${prevContent}, currentContent=${currentContent}`);
    if(prevContent !== null && currentContent !== null) {
        if(prevContent !== currentContent) {
            gotoContent(prevContent)
        }
    }
}

function handleHowToClick() {
    gotoContent('help');
}