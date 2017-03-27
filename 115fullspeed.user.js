// ==UserScript==
// @name        115fullspeed
// @namespace   https://github.com/gameclamp/115fullspeed
// @homepageURL https://github.com/gameclamp/115fullspeed
// @supportURL  https://github.com/gameclamp/115fullspeed/issues
// @description 批量获取下载地址;调用本地播放器(potplayer)播放原画视频;按文件大小顺序发送下载任务到aria2，更多帮助查看https://github.com/gameclamp/115fullspeed
// @author      9尾雪狐(gameclamp)
// @icon        https://github.com/gameclamp/115fullspeed/raw/master/icon.ico
// @include     http*://115.com/?ct=file*
// @include     http*://115.com/?aid=-1&search*
// @downloadURL https://github.com/gameclamp/115fullspeed/raw/master/115fullspeed.user.js
// @updateURL   https://github.com/gameclamp/115fullspeed/raw/master/115fullspeed.meta.js
// @version     0.3.8
// @grant       GM_xmlhttpRequest
// ==/UserScript==
var observer = new MutationObserver(addbtu);
var decoder = document.createElement('textarea');
observer.observe(document.querySelector('#js_data_list'),{'childList':true})
function addbtu(e){
	var filelist = document.querySelectorAll('li[file_mode="9"],li[file_mode="4"]');
	var elmInput;
	for (var i = filelist.length - 1; i >= 0; --i) {
		elmInput = filelist[i];
		(elmInput.querySelector('div.file-opr')||elmInput.querySelector('span.file-name')).appendChild(creator('a','<span>打开</span>','','',getOne));
	}
}
function getOne(e){
	var elmInput = e.target.parentElement.parentElement.parentElement;
	if(elmInput.querySelector('.fslink')){
		oneASX({'url':elmInput.querySelector('.fslink').href,'elm':elmInput});
	}else{
        var dl = new DOWNL();
		dl.GM_get({'method':'download','pickcode':elmInput.getAttribute('pick_code'),'elm':elmInput,'callback':oneASX})
	}
}
function oneASX(obj){
	var hrefs = '<ASX Version="3.0">';
        hrefs += '<Entry><Title>' + obj.elm.getAttribute('title') + '</Title><Ref href ="' + obj.url + '" /></Entry>';
    hrefs += '</ASX>'
    var aFileParts = [hrefs];
    var oMyBlob = new Blob(aFileParts,{'type':'video/x-ms-asf-plugin'});
    var url = URL.createObjectURL(oMyBlob);
    location.href = url;
    // var a = document.createElement('a');
    // var asxName = document.querySelector('#js_top_bar_box .file-path a:last-child');
    // a.download = (asxName.title ||asxName.innerHTML) + '.asx';
    // a.href = url;
    // document.body.appendChild(a);
    // a.click();
} 
// function getCookie(c_name){
    // if (document.cookie.length>0){
        // c_start=document.cookie.indexOf(c_name + "=")
        // if (c_start!=-1){
            // c_start=c_start + c_name.length+1
            // c_end=document.cookie.indexOf(";",c_start)
            // if (c_end==-1) c_end=document.cookie.length
            // console.log(document.cookie.substring(c_start,c_end))
            // return document.cookie.substring(c_start,c_end)
        // }
    // }
    // return ""
// }
function putLink(obj){
	var a = document.createElement('a');
	a.href = obj.url;
	a.innerHTML = "<span>极速连接</span>"
	a.className = "fslink";
	if(obj.elm.querySelector('.fslink')){//如果已经有极速连接就替换掉
		obj.elm.querySelector('.fslink').remove();
	}
	if(obj.elm.querySelector('.file-opr')){
		obj.elm.querySelector('.file-opr').appendChild(a);
	}else{
		obj.elm.querySelector('.file-name').appendChild(a);
	}
	if(obj.callback){obj.callback(obj)}
}
function pushtoARIA2(uri,out){
    var options = {}
    var UID = getCookie('UID');
    var CID = getCookie('CID');
    var SEID = getCookie('SEID');
    var cookies = `Cookie: UID=${UID};CID=${CID};SEID=${SEID}`;
    options.header = [cookies,"User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.75 Safari/537.36 115Browser/7.2.5","Referer: http://115.com","Accept: */*"];
    decoder.innerHTML = out;
    options.out = decoder.value;
    options['max-connection-per-server'] = 2;
    options['continue'] = true;
    var aria2 = new ARIA2('http://localhost:6800/jsonrpc');
    // console.log(options);
    aria2.addUri(uri,options);
}
function by(name,order){
    return function(o,p){
        var a = o[name];
        var b = p[name];
        if(a===b){return 0}
        return a<b?order*-1:order*1;
    }
}
function DOWNL(){
    this.downloadlist = [];
    this.downloadlist2 = [];
    this.remainfolder = 0;
    this.remainfile = 0;
    this.download2 = function(obj){
        console.log('download2fn')
        console.log(obj);
        if(obj){
            var filelist = obj.filelist.data;
            var count = obj.count;
            for (var i in filelist) {
                if(!filelist[i].d){
                    console.log('folder!!!');
                    obj.cid = filelist[i].cid;
                    var F = function(){
                        this.path = obj.path + filelist[i].ns+'/';
                    }
                    F.prototype = obj;
                    this.GM_get(new F());
                }else{
                    this.downloadlist.push({'pickcode':filelist[i].pc,'size':filelist[i].s,'filename':obj.path + filelist[i].n});
                }
            }
            console.log(obj.path);
        }
        if(this.remainfolder==0){
            console.log(this.downloadlist);
            console.log(this.downloadlist.length);
            this.remainfile = this.downloadlist.length;
            while(item = this.downloadlist.shift()){
                item.method = 'files';
                this.GM_get(item);
        }
        }
    }
    this.readytodown = function(){
        var sarr = [];
        var barr = [];
        while(item = this.downloadlist2.pop()){
            if(item.size<20480000){
                sarr.push(item);
            }else{
                barr.push(item);
            }
        }
        sarr.sort(by('size',1));
        while(item = sarr.shift()){
            console.log(item);
            pushtoARIA2(item.uri,item.filename);
        }
        barr.sort(by('filename',1));
        while(item = barr.shift()){
            console.log(item);
            pushtoARIA2(item.uri,item.filename);
        }
    }
    this.GM_get = function(obj){
        var self = this;
        switch(obj.method){
            case 'download':
                url = 'https://webapi.115.com/files/download?pickcode=' + obj.pickcode + '&_=' + Date.now();
                break;
            case 'files':
                url = 'https://webapi.115.com/files/download?pickcode=' + obj.pickcode + '&_=' + Date.now();
                break;
            case 'folder':
                self.remainfolder++;
                console.log('增加一个现在是：'+self.remainfolder)
                url = 'http://aps.115.com/natsort/files.php?aid=1&cid=' + obj.cid + '&o=file_name&asc=1&offset=0&show_dir=1&limit=999&code=&scid=&snap=0&natsort=1&source=&format=json&type=&star=&is_share=';
                break;
        }
        console.log(url)
        GM_xmlhttpRequest({
            synchronous:false,
            method:'GET',
            // url:'http://pro.api.115.com/app/chrome/down?method=get_file_url&pickcode=' + pickcode,
            url:url,
            headers:{
            'Accept':'*/*',
            'Accept-Encoding':'gzip, deflate, sdch',
            'Accept-Language':'zh-CN,zh;q=0.8',
            'User-agent':'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.75 Safari/537.36 115Browser/7.2.5',
            'X-Requested-With':'XMLHttpRequest',
            'Referer':'http://web.api.115.com/bridge_2.0.html?namespace=Core.DataAccess&api=UDataAPI&_t=v5',
            'Cookie':document.cookie
            },
            onload:function(res){
                var file = JSON.parse(res.responseText);
                console.log('get');
                console.log(file);
                switch(obj.method){
                    case 'download':
                        putLink({'url':file.file_url,'elm':obj.elm,'callback':obj.callback});
                        break;
                    case 'files':
                        self.remainfile--;
                        obj.uri = file.file_url;
                        self.downloadlist2.push(obj);
                        console.log('剩下' + self.remainfile + '个文件')
                        if(self.remainfile == 0){self.readytodown()};
                        break;
                    case 'folder':
                        self.remainfolder--;
                        console.log('减掉一个现在是：'+self.remainfolder);
                        obj.filelist = file;
                        // console.log(obj);
                        self.download2(obj);
                        break;
                }
                
            }
        })
    }
    this.download = function(){
        var elmInput;
        var filelist = document.querySelectorAll('.list-contents li.selected');
        for (var i = filelist.length - 1; i >= 0; --i) {
            elmInput = filelist[i];
            console.log(elmInput)
            if(elmInput.getAttribute('file_type')==0){
                var obj = new Object();
                obj.method = 'folder';
                obj.cid = elmInput.getAttribute('cate_id');
                obj.path = elmInput.getAttribute('title')+'/';
                console.log(obj.path);
                this.GM_get(obj);
            }else{
                this.downloadlist.push({'pickcode':elmInput.getAttribute('pick_code'),'size':elmInput.getAttribute('file_size'),'filename':elmInput.getAttribute('title')});
            }
        }
        this.download2();
    }
    this.fullspeed = function(){
        var filelist = document.querySelectorAll('.list-contents li.selected[file_type="1"]');
        if(filelist.length == 0){
            filelist = document.querySelectorAll('.list-contents li[file_type="1"]');
        }
        var elmInput;
        for (var i = filelist.length - 1; i >= 0; --i) {
            elmInput = filelist[i];
            this.GM_get({'method':'download','pickcode':elmInput.getAttribute('pick_code'),'elm':elmInput});
        }
    }
}


var ARIA2 = (function() {
  var jsonrpc_version = '2.0';

  function get_auth(url) {
    return url.match(/^(?:(?![^:@]+:[^:@\/]*@)[^:\/?#.]+:)?(?:\/\/)?(?:([^:@]*(?::[^:@]*)?)?@)?/)[1];
  };

  function request(jsonrpc_path, method, params) {
    var request_obj = {
        jsonrpc: jsonrpc_version,
        method: method,
        id: (new Date()).getTime().toString(),
    };
    if (params) request_obj['params'] = params;

    var auth = get_auth(jsonrpc_path);

    // 用 GM_xmlhttpRequest 防止 NoScript 拦截，用 setTimeout 防止外部无法调用
    setTimeout(function(){
        GM_xmlhttpRequest({
            method: 'POST',
            url: jsonrpc_path + '?tm=' + (new Date()).getTime().toString(),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            },
            data: JSON.stringify(request_obj)
        });
    }, 0);
  };

  return function(jsonrpc_path) {
    this.jsonrpc_path = jsonrpc_path;
    this.addUri = function (uri, options) {
      request(this.jsonrpc_path, 'aria2.addUri', [[uri, ], options]);
    };
    return this;
  }
})();

var clrLink = function(){
	var linklist = document.querySelectorAll('.list-contents .fslink');
    for (var i = linklist.length,j=0; j < i; j++) {
        linklist[j].remove();
    }
}
var getAll = function(){
    var linklist = document.querySelectorAll('.list-contents .fslink');
    var hrefs = "";
    for (var i = linklist.length,j=0; j < i; j++) {
        hrefs += '<a href="'+linklist[j].href+'">'+linklist[j].parentElement.parentElement.getAttribute('title')+'</a><br>';
    }
    var aFileParts = [hrefs];
    var oMyBlob = new Blob(aFileParts,{'type':'text/html;charset=UTF-8'});
    var url = URL.createObjectURL(oMyBlob);
    window.open(url);
}
var getASX = function(){
    var linklist = document.querySelectorAll('.list-contents .fslink');
    var hrefs = '<ASX Version="3.0">';
    for (var i = linklist.length,j=0; j < i; j++) {
        hrefs += '<Entry><Title>' + linklist[j].parentElement.parentElement.getAttribute('title') + '</Title><Ref href ="' + linklist[j].href + '" /></Entry>';
    }
    hrefs += '</ASX>'
    var aFileParts = [hrefs];
    var oMyBlob = new Blob(aFileParts,{'type':'video/x-ms-asf-plugin'});
    var url = URL.createObjectURL(oMyBlob);
    location.href = url;
    // var a = document.createElement('a');
    // var asxName = document.querySelector('#js_top_bar_box .file-path a:last-child');
    // a.download = (asxName.title ||asxName.innerHTML) + '.asx';
    // a.href = url;
    // document.body.appendChild(a);
    // a.click();
}
var creator = function(tagname,inner,id,style,fn){
    var a = document.createElement(tagname);
    if(fn){a.addEventListener('click',fn,false)};
    a.innerHTML = inner;
    a.href = "javascript:;"
    a.id = id;
    a.style.cssText = style;
    return a;
}
function fullspeed(){
    var obj = new DOWNL();
    obj.fullspeed();
}
function download(){
    var obj = new DOWNL();
    obj.download();
}
function getCookie(name){
    var arr,reg=new RegExp("(^| )"+name+"=([^;]*)(;|$)");
    if(arr=document.cookie.match(reg))
        return unescape(arr[2]);
    else
     return null;
}
var div = creator('div','','','position: fixed;right: 210px;top: 5px;z-index: 10000;')
div.appendChild(creator('a','下载','','margin-right:5px;',download));
div.appendChild(creator('a','clr','','margin-right:5px;',clrLink));
div.appendChild(creator('a','获取连接','','margin-right:5px;font-size:20px;',fullspeed));
div.appendChild(creator('a','输出全部','','margin-right:5px;',getAll));
div.appendChild(creator('a','导出ASX','','margin-right:5px;',getASX));
document.body.appendChild(div);
