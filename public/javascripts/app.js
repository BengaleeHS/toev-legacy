var selections=document.querySelectorAll('.selection');
var frm = document.querySelector('form');
var inputcell = document.querySelector('.inputcell');
var votes = document.querySelector('#votes');
var nav = document.querySelector('nav');

function addSelection()
{
    selections = document.querySelectorAll('.selection');
    if(selections.length>5)
        return;
    else{
        var asdf = document.createElement('input',"type='text'");
        asdf.setAttribute('class','selection');
        asdf.setAttribute('maxlength', '10');
        asdf.setAttribute('name', 'selection' + (selections.length + 1).toString());
        asdf.required = true;
        inputcell.appendChild(asdf);
    }
    selections = document.querySelectorAll('.selection');
}
function delSelection()
{
    selections = document.querySelectorAll('.selection');
    if(selections.length>2)
    {
        inputcell.removeChild(selections[selections.length-1]);
    }
    
}

function submit()
{
    selections = document.querySelectorAll('.selection');
    var text = document.querySelector('#context').value;
    var select = new Array(selections.length);
    for(var i=0;i<selections.length;i++)
        select[i] = selections[i].value;
    loadq();
}

function loadq() {
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200 || xhr.status == 201) {
            votec = document.querySelectorAll('div.votecont');
            for (var k = 0; k < votec.length; k++) {
                votes.removeChild(votec[k]);
            }
            if (xhr.responseText) {
                var org = JSON.parse(xhr.responseText);
                var json = org.vote;
                console.log(json);
                for (var i = 0; i < json.length; i++) {
                    var votecont = document.createElement('div');
                    votecont.setAttribute('id', 'vote' + json[i]['id']);
                    votecont.setAttribute('class', 'votecont');
                    var par = document.createElement('p');
                    par.innerHTML = '<strong>' + json[i].question + '</strong>';
                    votecont.appendChild(par);
                    for (var j = 1; j <= 6; j++) {

                        if (json[i]['q' + j]) {
                            var divv = document.createElement('div');
                            divv.setAttribute('class', 'buttondiv');
                            var but = document.createElement('input');
                            but.setAttribute('type', 'button');
                            but.setAttribute('value', json[i]['q' + j]);
                            but.setAttribute('class', 'sel');
                            but.setAttribute('onclick', 'sendrequest(' + json[i]['id'] + ',' + j + ')');
                            divv.appendChild(but);
                            var pp = document.createElement('p');
                            pp.setAttribute('class', 'buttondiv');
                            divv.append(pp);
                            votecont.appendChild(divv);
                        }
                    }
                    votes.appendChild(votecont);
                }
                for (var i = 0; i < org.log.length; i++) {
                    var selected = document.querySelector('#vote' + org.log[i].voted);
                    var buttons = selected.querySelectorAll('.sel');
                    for (var j = 0; j < buttons.length; j++) {
                        buttons[j].disabled = true;
                    }
                    var result = document.createElement('input');
                    result.setAttribute('class', 'result');
                    result.setAttribute('type', 'button');
                    result.setAttribute('value', '결과보기');
                    result.setAttribute('onclick', 'result(' + org.log[i].voted + ')');
                    selected.appendChild(result);
                }
            }
                

            
            
            
        }
    }
    xhr.open('GET', '/load');
    xhr.send(null);

}

function sendrequest(id, sel) {
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            
        }
    }
    xhr.open("POST", "/apply", true);
    xhr.setRequestHeader("Content-type", "application/json");
    var dat = { id: id, sel: sel };
    dat = JSON.stringify(dat);
    console.log(dat);
    xhr.send(dat);
    loadq();
}

function result(id) {
    var xhr = new XMLHttpRequest();
    var votecont = document.querySelector('#vote' + id);
    xhr.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var resp = JSON.parse(xhr.responseText);
            console.log(resp);
            var res = votecont.querySelector('.result')
            res.remove();
            var divs = votecont.querySelectorAll('div.buttondiv');
            
            var sum = 0;

            for (var i = 1; i <= 6; i++) {
                sum += parseInt(resp[0]['q' + i]);
                
            }
            
            for (var i = 1; i <= 6; i++) {
                if (divs[i - 1]) {
                    var q = divs[i - 1].querySelector('p');
                    var rat = (resp[0]['q' + i] / sum * 100).toFixed(2);
                    q.innerHTML = '<strong>' + parseInt(resp[0]['q' + i]) + '표 / ' + rat + '%';
                }
            }
        }
    }
    xhr.open("POST", '/result');
    var dat = { id: id };
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.send(JSON.stringify(dat));
}

onload = loadq();
addEventListener('wheel', function (ev) {
    if (ev.wheelDelta < 0) {
        nav.setAttribute('class', 'hide');
    }
    if (ev.wheelDelta > 0) {
        nav.removeAttribute('class');
    }
})


var touchStart = false;
var sy,y;
addEventListener('touchstart', function (e) {
    touchStart = true;
    sy = e.changedTouches[0].pageY
})

addEventListener('touchmove', function (e) {
    if (touchStart) {
        if (sy - e.changedTouches[0].pageY > 5) {
            nav.setAttribute('class', 'hide');
        }
        if (sy - e.changedTouches[0].pageY < - 5) {
            nav.removeAttribute('class');
        }
    }
    
});
addEventListener('touchend', function (e) {
    touchStart = false;
})