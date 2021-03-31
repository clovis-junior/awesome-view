"use strict";
const w=window, d=document,
    aws_label_query="[data-aws-view]";
var aws_previous_hash="",
    aws_slideshow, aws_slideshow_index=0, aws_slideshow_array=[], aws_captions_array=[], aws_slideshow_interval=5000, aws_slideshow_running=false, aws_slideshow_progress=0,
    aws_move_initial_x, aws_move_initial_y, aws_move_x, aws_move_y,
    aws_move_x_limit=parseInt(w.innerWidth * .25), aws_move_y_limit=parseInt(w.innerHeight * .5);

const aws_move_limit=parseInt((aws_move_x_limit + aws_move_y_limit) * .1);


function _aws_add_zero(num){
    num=num || 0;
    let string_num=num.toString();
    return (string_num.length < 2) ? "0"+ string_num : string_num
}

function _aws_slugfy(str){
    str=str || "";
    str=str.trim(),
    str=str.normalize("NFKD"),
    str=str.replace(/[\u0300-\u036F]/g, "")
        .replace(/\s+/gm, "-")
        .replace(/[^\w\-]+/gm, "")
        .replace(/\-\-+/gm, "-")
        .replace(/^\-+/gm, "")
        .replace(/\-+$/gm, ""),
    str=str.toLowerCase();
    return str
}

function _aws_animation(elmnt, anim_name, ms){
    elmnt.classList.add("aws-view_"+ anim_name +"-"+ ms);
    setTimeout(()=> {
        elmnt.classList.remove("aws-view_"+ anim_name +"-"+ ms)
    }, ms)
}

function _aws_slideshow_shortcut(evt){
    evt=evt || w.event;
    switch(evt.code){
        case "Space":
        case "KeyP":
            _aws_slideshow_toggle();
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

    evt.target.style.transform="translate("+ (Math.abs(x) <= aws_move_x_limit ? x : (Math.sign(x) == -1 ? -aws_move_x_limit : aws_move_x_limit) ) +"px, "+ (Math.abs(y) <= aws_move_y_limit ? y : (Math.sign(y) == -1 ? -aws_move_y_limit : aws_move_y_limit) ) +"px)";
        
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

function _aws_slideshow_show(img){
    if(aws_slideshow_array.length <= 0) return false
    img=img || 0;

    if(img > aws_slideshow_array.length) img=1;
    else if(img < 1) img=aws_slideshow_array.length;

    let aws_progress_elmnt=d.querySelector(".aws-view_progress");
    aws_slideshow_progress=0;
    
    if(aws_progress_elmnt && aws_progress_elmnt.children[0])
        aws_progress_elmnt.children[0].style.width=aws_slideshow_progress;

    if(aws_captions_array[img - 1] && aws_captions_array[img - 1].trim().length > 0){
        if(!d.querySelector(".aws-view_caption"))
            _aws_create_caption(d.querySelector(".aws-view_content"), aws_captions_array[img - 1])
    
        d.querySelector(".aws-view_caption").innerHTML=aws_captions_array[img - 1]
    }else if((!aws_captions_array[img - 1] || aws_captions_array[img - 1].trim().length <= 0) && d.querySelector(".aws-view_caption")){
        const caption_elmt=d.querySelector(".aws-view_caption");
        _aws_animation(caption_elmt, "fade-out", 220);
        setTimeout(()=>{
            caption_elmt.parentNode.removeChild(caption_elmt)
        }, 220)
    }

    let image=new Image();
    image.onabort=()=>{
        alert("Não foi possível carregar a imagem.")
    },
    image.onprogress=()=>{
        if(d.querySelector(".aws-view_box"))
            d.querySelector(".aws-view_box").innerHTML="<div class=aws-view_loader></div>";
    },
    image.onload=evt=>{
        aws_slideshow_index=img;

        if(!d.querySelector(".aws-view_box")) return;
        
        d.querySelector(".aws-view_box").innerHTML="";

        let hash="",
            image_elmnt=d.createElement("canvas"), image_elmnt_ctx=image_elmnt.getContext("2d", {antialias:true, depth:false});
        
        if(!image_elmnt_ctx){
            image_elmnt=d.createElement("img");
            image_elmnt.style.setProperty("max-width", evt.target.naturalWidth +"px", "important");
            image_elmnt.style.setProperty("max-height", evt.target.naturalHeight +"px", "important");
            image_elmnt.src=evt.target.src;
            image_elmnt.alt=""
        }else{
            image_elmnt.width=parseInt(evt.target.naturalWidth * _aws_resize_image(evt.target.naturalWidth, evt.target.naturalHeight)), image_elmnt.height=parseInt(evt.target.naturalHeight * _aws_resize_image(evt.target.naturalWidth, evt.target.naturalHeight));
            image_elmnt_ctx.drawImage(evt.target, 0, 0, image_elmnt.width, image_elmnt.height)
        }

        if(w.location.hash.length > 0) aws_previous_hash=w.location.hash;
        w.location.hash=(Number.isInteger(w.location.hash.slice(0, -2)) ? w.location.hash.slice(0, -2) : w.location.hash.slice(0, -1)) + aws_slideshow_index;

        d.querySelector(".aws-view_box").appendChild(image_elmnt);
        _aws_animation(image_elmnt, "fade-in", 220);
        
        if(d.querySelector("[aria-label*=aws-view-show-index]"))
            d.querySelector("[aria-label*=aws-view-show-index]").innerText=_aws_add_zero(img);
    };
    image.src=aws_slideshow_array[img - 1];

    return false
}
function _aws_slideshow_toggle(evt){
    evt=evt || w.event;
    evt.preventDefault();
    if(aws_slideshow_running == true){
        let aws_progress_elmnt=d.querySelector(".aws-view_progress");
        if(aws_progress_elmnt){
            _aws_animation(aws_progress_elmnt, "fade-out", 220);
            setTimeout(()=>{
                aws_progress_elmnt.parentNode.removeChild(aws_progress_elmnt)
            }, 220)
        }

        clearInterval(aws_slideshow);
        aws_slideshow_progress=0
        aws_slideshow=null
    }else{
        const aws_progress_elmnt_create=d.createElement("div");
        aws_progress_elmnt_create.className="aws-view_progress";
        aws_progress_elmnt_create.innerHTML="<div></div>";
        
        d.querySelector(".aws-view_overlay").appendChild(aws_progress_elmnt_create);
        _aws_animation(aws_progress_elmnt_create, "fade-in", 220);

        aws_slideshow=setInterval(()=>{
            aws_slideshow_progress+=Math.ceil(aws_slideshow_interval * 2 / 100);
            let aws_slideshow_percent=Math.abs(aws_slideshow_progress / aws_slideshow_interval * 100);
            aws_progress_elmnt_create.children[0].style.width=aws_slideshow_percent +"%";
            if(aws_slideshow_percent > 100 || aws_slideshow_progress > aws_slideshow_interval){
                _aws_slideshow_show(aws_slideshow_index += +1);
                aws_progress_elmnt_create.children[0].style.width=aws_slideshow_progress=0
            }
        }, 100)
    }
        

    if(aws_slideshow_running && d.querySelector(".aws-icon.pause")){
        d.querySelector(".aws-icon.pause").classList.add("play");
        d.querySelector(".aws-icon.pause").classList.remove("pause")
    }else if(!aws_slideshow_running && d.querySelector(".aws-icon.play")){
        d.querySelector(".aws-icon.play").classList.add("pause");
        d.querySelector(".aws-icon.play").classList.remove("play")
    }

    aws_slideshow_running=!aws_slideshow_running;
    return false
}

function _aws_close_modal(evt){
    evt=evt || w.event;
    d.onkeyup=null;
    evt.preventDefault();
    let modal_elmnt=d.querySelector(".aws-view_overlay");
    if(modal_elmnt){
        d.body.style.removeProperty("overflow");
        w.history.pushState("", d.title, w.location.href.split("#")[0]);
        _aws_animation(modal_elmnt, "fade-out", 220);
        setTimeout(()=>{
            modal_elmnt.parentNode.removeChild(modal_elmnt)
        }, 220)
    }
    aws_slideshow_progress=aws_slideshow_index=0,
    aws_slideshow_array=[],
    aws_previous_hash="";
    if(aws_slideshow != null || aws_slideshow_running == true){
        clearInterval(aws_slideshow),
        aws_slideshow_running=false,
        aws_slideshow=null
    }
    return false
}

function _aws_toggle_fullscreen(evt){
    evt=evt || w.event;
    evt.preventDefault();
    let modal_elmnt=d.querySelector(".aws-view_overlay");
    if(modal_elmnt){
        if(d.fullscreenElement || d.webkitFullscreenElement || d.mozFullScreenElement || d.msFullscreenElement){
            if(d.querySelector(".aws-icon.minimize")){
                d.querySelector(".aws-icon.minimize").classList.add("maximize");
                d.querySelector(".aws-icon.minimize").classList.remove("minimize")
            }
            if(d.exitFullscreen) d.exitFullscreen();
            else if(d.mozCancelFullScreen) d.mozCancelFullScreen();
            else if(d.webkitExitFullscreen) d.webkitExitFullscreen();
            else if(d.msExitFullscreen) d.msExitFullscreen();
        }else{
            if(d.querySelector(".aws-icon.maximize")){
                d.querySelector(".aws-icon.maximize").classList.add("minimize");
                d.querySelector(".aws-icon.maximize").classList.remove("maximize")
            }
            if(modal_elmnt.requestFullscreen) modal_elmnt.requestFullscreen();
            else if(modal_elmnt.mozRequestFullScreen) modal_elmnt.mozRequestFullScreen();
            else if(modal_elmnt.webkitRequestFullscreen) modal_elmnt.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
            else if(modal_elmnt.msRequestFullscreen) modal_elmnt.msRequestFullscreen();
        }
    }
    return false
}

function _aws_resize_image(width, height){
    width=parseInt(width) || Math.ceil(screen.width * .5),
    height=parseInt(height) || Math.ceil(screen.height * .5);
    let div=0;

    if((screen.width * .9 > width) || (screen.height * .9 > height)) div=.95;
    else if((screen.width * .75 > width) || (screen.height * .75 > height)) div=.8;
    else if((screen.width * .5 > width) || (screen.height * .5 > height)) div=.75;
    else div=.6;

    return div
}

function _aws_create_caption(elmt, caption){
    if(d.querySelector(".aws-view_caption")) return;

    caption=caption.toString() || "";
    const caption_elmt=d.createElement("div");
    caption_elmt.className="aws-view_caption";
    caption_elmt.innerHTML=caption.trim();
    if(elmt && elmt instanceof Element){
        elmt.appendChild(caption_elmt);
        _aws_animation(caption_elmt, "fade-in", 220)
    }
}

function _aws_open_modal(evt){
    evt=evt || w.event;
    const elmnt=evt.target,
        modal_elmnt=d.createElement("div"),
        modal_close_btn_elmnt=d.createElement("a"),
        modal_fullscreen_btn_elmnt=d.createElement("a"),
        modal_slideshow_btn_elmnt=d.createElement("a"),
        modal_content_wrapper_elmnt=d.createElement("div"),
        modal_content_elmnt=d.createElement("div"),
        content_box_elmnt=d.createElement("div");

    let hash="", source=(elmnt.hasAttribute("data-aws-view-source") ? elmnt.getAttribute("data-aws-view-source") : elmnt.src);

    if(elmnt.hasAttribute("data-aws-view-skin"))
        modal_elmnt.className="aws-view_overlay aws-skin-"+ elmnt.getAttribute("data-aws-view-skin");
    else if(w.matchMedia)
        modal_elmnt.className="aws-view_overlay aws-skin-"+ (w.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    else
        modal_elmnt.className="aws-view_overlay";
    
    modal_elmnt.className=(elmnt.hasAttribute("data-aws-view-skin") ? "aws-view_overlay aws-skin-"+ elmnt.getAttribute("data-aws-view-skin") : "aws-view_overlay");
    modal_content_wrapper_elmnt.className="aws-view_content-wrapper";
    modal_content_elmnt.className="aws-view_content";
    content_box_elmnt.className="aws-view_box";

    modal_close_btn_elmnt.className=modal_fullscreen_btn_elmnt.className=modal_slideshow_btn_elmnt.className="aws-btn";
    modal_close_btn_elmnt.href="#aws-view-close";
    modal_close_btn_elmnt.innerHTML="<span aria-hidden=true class=\"aws-icon close\"></span>";

    modal_fullscreen_btn_elmnt.href="#aws-view-toggle-fullscreen";
    modal_fullscreen_btn_elmnt.innerHTML="<span aria-hidden=true class=\"aws-icon maximize\"></span>";

    if(elmnt.hasAttribute("data-aws-view-group")){
        let group=d.querySelectorAll("[data-aws-view-group*=\""+ elmnt.getAttribute("data-aws-view-group") +"\"]");
        const modal_info_elmnt=d.createElement("div"), modal_prev_btn_elmnt=d.createElement("a"), modal_next_btn_elmnt=d.createElement("a");

        hash+="aws-glr="+ _aws_slugfy(elmnt.getAttribute("data-aws-view-group"));

        if(elmnt.hasAttribute("data-aws-view-caption")){
            if(group.length > 1){
                let captions=d.querySelectorAll("[data-aws-view-group*=\""+ elmnt.getAttribute("data-aws-view-group") +"\"][data-aws-view-caption]");
    
                for(let i=0;i<captions.length;++i)
                    aws_captions_array.push(captions[i].getAttribute("data-aws-view-caption").toString().trim());
            }

            _aws_create_caption(modal_content_elmnt, elmnt.getAttribute("data-aws-view-caption"))
        }

        if(group.length > 1){
            modal_slideshow_btn_elmnt.href="#aws-view-slideshow";
            modal_slideshow_btn_elmnt.innerHTML="<span aria-hidden=true class=\"aws-icon play\"></span>";
            modal_slideshow_btn_elmnt.addEventListener("click", _aws_slideshow_toggle, false);
            modal_content_elmnt.appendChild(modal_slideshow_btn_elmnt);

            modal_next_btn_elmnt.className=modal_prev_btn_elmnt.className="aws-btn";
            modal_prev_btn_elmnt.href="#aws-view-prev";
            modal_prev_btn_elmnt.innerHTML="<span aria-hidden=true class=\"aws-icon arrow-left\"></span>";
            modal_content_elmnt.appendChild(modal_prev_btn_elmnt);
    
            modal_next_btn_elmnt.href="#aws-view-next";
            modal_next_btn_elmnt.innerHTML="<span aria-hidden=true class=\"aws-icon arrow-right\"></span>";
            modal_content_elmnt.appendChild(modal_next_btn_elmnt);
    
            modal_prev_btn_elmnt.onclick=evt=>{
                evt.preventDefault();
                _aws_slideshow_show(aws_slideshow_index += -1);
                return false
            };
            modal_next_btn_elmnt.onclick=evt=>{
                evt.preventDefault();
                _aws_slideshow_show(aws_slideshow_index += +1);
                return false
            };

            for(let i=0;i<group.length;++i){
                let elmt_source=(group[i].hasAttribute("data-aws-view-source") ? group[i].getAttribute("data-aws-view-source") : group[i].src);
                if(elmt_source == source) aws_slideshow_index=(i + 1);
                aws_slideshow_array.push(group[i].hasAttribute("data-aws-view-source") ? group[i].getAttribute("data-aws-view-source") : group[i].src)
            }

            modal_info_elmnt.className="aws-view_info";
            modal_info_elmnt.innerHTML="<span aria-label=aws-view-show-index>"+ _aws_add_zero(aws_slideshow_index) +"</span>/<span aria-label=aws-view-show-count>"+ _aws_add_zero(group.length) +"</span>";
            modal_content_elmnt.appendChild(modal_info_elmnt);

            modal_elmnt.onclick=evt=>{
                let aws_clicked_out=!(evt.target.classList.contains("aws-view_box") || evt.target.classList.contains("aws-btn") || evt.target.classList.contains("aws-view_info"));
                if(aws_clicked_out){
                    _aws_close_modal();
                    return false
                }else return
            };
            d.addEventListener("keyup", _aws_slideshow_shortcut, false)
        }else aws_slideshow_index=0;
    }else if(!elmnt.hasAttribute("data-aws-view-group") && elmnt.hasAttribute("data-aws-view-caption"))
        _aws_create_caption(modal_content_elmnt, elmnt.getAttribute("data-aws-view-caption"));

    content_box_elmnt.onmousedown=content_box_elmnt.ontouchstart=_aws_box_grab_start,
    content_box_elmnt.ontouchmove=_aws_box_grab_move,
    content_box_elmnt.onmouseup=content_box_elmnt.ontouchend=_aws_box_grab_end;

    modal_elmnt.appendChild(modal_content_wrapper_elmnt);
    modal_content_wrapper_elmnt.appendChild(modal_content_elmnt);
    modal_content_elmnt.appendChild(modal_close_btn_elmnt);
    modal_content_elmnt.appendChild(modal_fullscreen_btn_elmnt);
    modal_content_elmnt.appendChild(content_box_elmnt);

    modal_close_btn_elmnt.onclick=_aws_close_modal;
    modal_fullscreen_btn_elmnt.onclick=_aws_toggle_fullscreen;

    if(!d.querySelector("link[href*=\"aws-view.css\"]")){
        const style_elmnt=d.createElement("link"),
            aws_asset_dir=d.querySelector("script[src*=\"aws-view.js\"]").src;
        style_elmnt.rel="stylesheet";
        style_elmnt.href=aws_asset_dir.replaceAll("js", "css") +"?t="+ new Date().getTime();
        style_elmnt.type="text/css";
        d.head.appendChild(style_elmnt)
    }

    d.body.appendChild(modal_elmnt);
    d.body.style.setProperty("overflow", "hidden", "important");
    _aws_animation(modal_elmnt, "fade-in", 220);

    let image=new Image();

    image.onabort=()=>{
        alert("Não foi possível carregar a imagem.")
    },
    image.onprogress=()=>{
        content_box_elmnt.innerHTML="<div class=aws-view_loader></div>";
    },
    image.onload=evt=> {
        content_box_elmnt.innerHTML="";
        let image_elmnt=d.createElement("canvas"), image_elmnt_ctx=image_elmnt.getContext("2d", {antialias:true, depth:false});
        
        if(!image_elmnt_ctx){
            image_elmnt=d.createElement("img");
            image_elmnt.style.setProperty("max-width", evt.target.naturalWidth +"px", "important");
            image_elmnt.style.setProperty("max-height", evt.target.naturalHeight +"px", "important");
            image_elmnt.src=evt.target.src;
            image_elmnt.alt=""
        }else{
            image_elmnt.width=parseInt(evt.target.naturalWidth * _aws_resize_image(evt.target.naturalWidth, evt.target.naturalHeight)), image_elmnt.height=parseInt(evt.target.naturalHeight * _aws_resize_image(evt.target.naturalWidth, evt.target.naturalHeight));
            image_elmnt_ctx.drawImage(evt.target, 0, 0, image_elmnt.width, image_elmnt.height)
        }

        hash+=(hash.length > 0 ? "&aws-img-index=" : "aws-img-index=");
        hash+=aws_slideshow_index;
        w.location.hash=hash;
        content_box_elmnt.appendChild(image_elmnt);
        _aws_animation(content_box_elmnt, "slide-up", 220)
    };
    image.src=source;

    d.addEventListener("keyup", evt=>{
        if(evt.altKey && evt.code == "Enter"){
            _aws_toggle_fullscreen();
            return false
        }
        switch(evt.code){
            case "Escape":
                _aws_close_modal();
                return false
            case "KeyF":
                _aws_toggle_fullscreen();
                return false
        }
    }, false);

    evt.preventDefault();
    return false
}

w.addEventListener("load", ()=>{
    if(w.location.hash.length > 0 && w.location.hash.indexOf("aws") > -1)
        w.history.pushState("", d.title, w.location.href.split("#")[0]);

    if(d.querySelector(aws_label_query)){
        if(d.querySelectorAll(aws_label_query).length > 1){
            for(let i=0;i<d.querySelectorAll(aws_label_query).length;++i)
                d.querySelectorAll(aws_label_query)[i].onclick=_aws_open_modal;
        }else d.querySelectorAll(aws_label_query).onclick=_aws_open_modal;
    }
}, false),
w.addEventListener("resize", evt=>{
    evt.preventDefault();
    aws_move_x_limit=parseInt(evt.target.innerWidth * .25), aws_move_y_limit=parseInt(evt.target.innerHeight * .5);
    return false
}, false);
w.addEventListener("hashchange", evt=>{
    const modal_elmnt=d.querySelector(".aws-view_overlay");
    if(modal_elmnt && (w.location.hash == aws_previous_hash || w.location.hash.length <= 0)){
        evt.preventDefault();
        _aws_close_modal();
        return false
    }
}, false)
