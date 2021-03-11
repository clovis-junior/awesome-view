"use strict";
const w=window, d=document, 
    aws_move_limit=80,
    aws_label_query="*[data-aws-view]";
var aws_slideshow, aws_slideshow_index=0, aws_slideshow_array=[], aws_slideshow_interval=1000, aws_slideshow_running=false, aws_slideshow_progress,
    aws_move_initial_x, aws_move_initial_y, aws_move_x, aws_move_y;

function _aws_animation(elmnt, anim_name, ms){
    elmnt.classList.add("aws-view_"+ anim_name +"-"+ ms);
    setTimeout(()=> {
        elmnt.classList.remove("aws-view_"+ anim_name +"-"+ ms)
    }, ms)
}

function _aws_box_grab_start(evt){
    evt=evt || w.event;
    evt.preventDefault();
    const rect=evt.target.getBoundingClientRect();
    let x=parseInt(((navigator.maxTouchPoints > 0 ? evt.changedTouches[0].clientX : evt.clientX) - rect.left) - (evt.target.offsetWidth * .5)),
        y=parseInt(((navigator.maxTouchPoints > 0 ? evt.changedTouches[0].clientY : evt.clientY) - rect.top) - (evt.target.offsetHeight * .5));

    if(navigator.maxTouchPoints > 0)
        evt.target.style.transform="translate("+ (Math.abs(x) <= (aws_move_limit * 2) ? x : (Math.sign(x) == -1 ? -(aws_move_limit * 2) : (aws_move_limit * 2)) ) +"px, "+ (Math.abs(y) <= (aws_move_limit / 2) ? y : (Math.sign(y) == -1 ? -(aws_move_limit / 2) : (aws_move_limit / 2)) ) +"px)"; 
    else{
        evt.target.onmousemove=(evt)=>{
            let x=parseInt(((navigator.maxTouchPoints > 0 ? evt.changedTouches[0].clientX : evt.clientX) - rect.left) - (evt.target.offsetWidth * .5)),
                y=parseInt(((navigator.maxTouchPoints > 0 ? evt.changedTouches[0].clientY : evt.clientY) - rect.top) - (evt.target.offsetHeight * .5));
    
            evt.target.style.transform="translate("+ (Math.abs(x) <= (aws_move_limit * 2) ? x : (Math.sign(x) == -1 ? -(aws_move_limit * 2) : (aws_move_limit * 2)) ) +"px, "+ (Math.abs(y) <= (aws_move_limit / 2) ? y : (Math.sign(y) == -1 ? -(aws_move_limit / 2) : (aws_move_limit / 2)) ) +"px)";
                
            aws_move_x=x,aws_move_y=y;
            return false
        }
    }

    aws_move_initial_x=x, aws_move_initial_y=y;
    return false
}
function _aws_box_grab_move(evt){
    evt=evt || w.event;
    const rect=evt.target.getBoundingClientRect();
    let x=parseInt(((navigator.maxTouchPoints > 0 ? evt.changedTouches[0].clientX : evt.clientX) - rect.left) - (evt.target.offsetWidth * .5)),
        y=parseInt(((navigator.maxTouchPoints > 0 ? evt.changedTouches[0].clientY : evt.clientY) - rect.top) - (evt.target.offsetHeight * .5));

    evt.target.style.transform="translate("+ (Math.abs(x) <= aws_move_limit ? x : (Math.sign(x) == -1 ? -aws_move_limit : aws_move_limit) ) +"px, "+ (Math.abs(y) <= (aws_move_limit * 2) ? y : (Math.sign(y) == -1 ? -(aws_move_limit / 2) : (aws_move_limit * 2)) ) +"px)";
        
    aws_move_x=x,aws_move_y=y;
    return false 
}
function _aws_box_grab_end(evt){
    evt=evt || w.event;
    evt.preventDefault();
    evt.target.onmousemove=null;
    let moved_x=parseInt(aws_move_x - aws_move_initial_x),
        moved_y=parseInt(aws_move_y - aws_move_initial_y);

    evt.target.style.transform="initial";

    if(aws_slideshow_array.length > 0){
        if(Math.sign(moved_x) == -1 && Math.abs(moved_x) >= aws_move_limit) _aws_slideshow_show(aws_slideshow_index += -1);
        else if(moved_x >= aws_move_limit) _aws_slideshow_show(aws_slideshow_index += +1);
        else if(Math.abs(moved_y) > aws_move_limit) _aws_close_modal();
    } 
            
    return false
}

function _aws_slideshow_show(id){
    if(aws_slideshow_array.length <= 0) return false
    id=id || 0;

    if(id > aws_slideshow_array.length) id=1;
    else if(id < 1) id=aws_slideshow_array.length;

    let image=new Image(), image_elmnt=d.querySelector(".aws-view_box > img");
    image.addEventListener("load", evt=> {
        image_elmnt.style.setProperty("max-width", evt.target.naturalWidth +"px", "important");
        image_elmnt.style.setProperty("max-height", evt.target.naturalHeight +"px", "important");
        image_elmnt.src=evt.target.src;
        _aws_animation(image_elmnt, "fade-in", 220)
        aws_slideshow_index=id
    }, false);
    image.src=aws_slideshow_array[id - 1];

    return false
}
function _aws_slideshow_toggle(){
    if(aws_slideshow_running == true){
        clearInterval(aws_slideshow);
        aws_slideshow_running=false;
        aws_slideshow_progress=0
    }else{
        aws_slideshow=setInterval(()=> _aws_slideshow_show(aws_slideshow_index += +1), aws_slideshow_interval);
        aws_slideshow_running=true
    }
    return false
}

function _aws_close_modal(evt){
    evt=evt || w.event;
    d.onkeyup=null;
    evt.preventDefault();
    let modal_elmnt=d.querySelector(".aws-view_overlay");
    if(modal_elmnt){
        d.body.style.removeProperty("overflow");
        _aws_animation(modal_elmnt, "fade-out", 220);
        setTimeout(()=>{
            modal_elmnt.parentNode.removeChild(modal_elmnt)
        }, 220)
    }
    return false
}
function _aws_open_modal(evt){
    evt=evt || w.event;
    const elmnt=evt.target,
        modal_elmnt=d.createElement("div"),
        modal_close_btn_elmnt=d.createElement("a"),
        modal_content_wrapper_elmnt=d.createElement("div"),
        modal_content_elmnt=d.createElement("div"),
        content_box_elmnt=d.createElement("div");

    let source=(elmnt.hasAttribute("data-aws-view-source") ? elmnt.getAttribute("data-aws-view-source") : elmnt.src);

    if(aws_slideshow_array.length > 0)  aws_slideshow_array=[];
    if(elmnt.hasAttribute("data-aws-view-group")){
        let group=d.querySelectorAll("*[data-aws-view-group="+ elmnt.getAttribute("data-aws-view-group") +"]");
        const modal_close_prev_elmnt=d.createElement("a"), modal_close_next_elmnt=d.createElement("a");

        modal_close_prev_elmnt.className="aws-btn";
        modal_close_prev_elmnt.href="#aws-view-prev";
        modal_close_prev_elmnt.innerHTML="<span aria-hidden=true class=\"aws-icon arrow-left\"></span>";

        modal_close_next_elmnt.className="aws-btn";
        modal_close_next_elmnt.href="#aws-view-next";
        modal_close_next_elmnt.innerHTML="<span aria-hidden=true class=\"aws-icon arrow-right\"></span>";

        modal_content_elmnt.appendChild(modal_close_prev_elmnt);
        modal_content_elmnt.appendChild(modal_close_next_elmnt);

        modal_close_prev_elmnt.addEventListener("click", evt=>{
            evt.preventDefault();
            _aws_slideshow_show(aws_slideshow_index += -1);
            return false
        },false);
        modal_close_next_elmnt.addEventListener("click", evt=>{
            evt.preventDefault();
            _aws_slideshow_show(aws_slideshow_index += +1);
            return false
        },false);

        for(let i=0;i<group.length;++i){
            let elmt_source=(group[i].hasAttribute("data-aws-view-source") ? group[i].getAttribute("data-aws-view-source") : group[i].src);
            if(elmt_source == source) aws_slideshow_index=(i + 1);
            aws_slideshow_array.push(group[i].hasAttribute("data-aws-view-source") ? group[i].getAttribute("data-aws-view-source") : group[i].src)
        }

        d.onkeyup=evt=>{
            switch(evt.code){
                case "Escape":
                case "KeyF":
                    _aws_close_modal();
                    return false
                case "ArrowLeft":
                case "PageDown":
                    _aws_slideshow_show(aws_slideshow_index += -1);
                    return false
                case "ArrowRight":
                case "PageUp":
                    _aws_slideshow_show(aws_slideshow_index += +1);
                    return false
            }
        }
    }

    modal_elmnt.className="aws-view_overlay";
    modal_content_wrapper_elmnt.className="aws-view_content-wrapper";
    modal_content_elmnt.className="aws-view_content";
    content_box_elmnt.className="aws-view_box";

    modal_close_btn_elmnt.href="#aws-view-close";
    modal_close_btn_elmnt.className="aws-btn";
    modal_close_btn_elmnt.innerHTML="<span aria-hidden=true class=\"aws-icon close\"></span>";

    content_box_elmnt.addEventListener("mousedown", _aws_box_grab_start, false),
    content_box_elmnt.addEventListener("mouseup", _aws_box_grab_end, false);
    content_box_elmnt.addEventListener("touchstart", _aws_box_grab_start, false),
    content_box_elmnt.addEventListener("touchmove", _aws_box_grab_move, false),
    content_box_elmnt.addEventListener("touchend", _aws_box_grab_end, false);

    modal_elmnt.appendChild(modal_content_wrapper_elmnt);
    modal_content_wrapper_elmnt.appendChild(modal_content_elmnt);
    modal_content_elmnt.appendChild(modal_close_btn_elmnt);
    modal_content_elmnt.appendChild(content_box_elmnt);

    modal_close_btn_elmnt.addEventListener("click", _aws_close_modal, false);

    let image=new Image();
    image.addEventListener("load", evt=> {
        let image_elmnt=d.createElement("img");
        image_elmnt.style.setProperty("max-width", evt.target.naturalWidth +"px", "important");
        image_elmnt.style.setProperty("max-height", evt.target.naturalHeight +"px", "important");
        image_elmnt.src=evt.target.src;
        image_elmnt.alt="";

        content_box_elmnt.appendChild(image_elmnt);
        _aws_animation(content_box_elmnt, "slide-up", 220)
    }, false);
    image.src=source;

    d.body.appendChild(modal_elmnt);
    d.body.style.setProperty("overflow", "hidden", "important");
    _aws_animation(modal_elmnt, "fade-in", 220);
    return false
}

if(d.querySelector(aws_label_query)){
    if(d.querySelectorAll(aws_label_query).length > 1){
        for(let i=0;i<d.querySelectorAll(aws_label_query).length;++i)
            d.querySelectorAll(aws_label_query)[i].onclick=_aws_open_modal;
    }else d.querySelectorAll(aws_label_query).onclick=_aws_open_modal;
}

w.addEventListener("hashchange", evt=>{
    let modal_elmnt=d.querySelector(".aws-view_overlay");
    if(modal_elmnt){
        evt.preventDefault();
        _aws_close_modal();
        return false
    }
}, false)
