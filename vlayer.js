;(function($){
	if(isExist()){console.log("请检查是否重复加载了juery.vlayer.js");return;}
	var zIndex=19900215;//设置焦点弹窗层级基数。
	$.fn.vvBox=function(options){
		var defaults={
			title:"Message",
			reqType:null,
			target:null,
			html:null,
			opacity:0.5,
			callBack:null,
			isResizePosition:true,
			showMin:true,
			drag:true,
			overlay:true,
			iframeWH:{
				width:400,
				height:240
			}
		},
		o=$.extend(true,defaults,options),
		vvBoxControlMin=o.showMin?'<i class="restore"></i><i class="min"></i>':'',
		vvBoxHtml=[		//弹窗容器
			'<div class="vvBox">',
				'<div class="vvBox_popup">',
					'<table><tr><td>',
						'<div class="vvBox_body">',
							'<div class="vvBox_title"><span>'+o.title+'</span><div class="control">'+vvBoxControlMin+'<i class="close"></i></div></div>',
							'<div class="vvBox_content"></div>',
						'</div>',
					'</td></tr></table>',
				'</div>',
			'</div>'
		],
		vvBoxOverlay='<div class="vvBox_overlay"></div>',//弹窗遮罩
		$win=$(window);
		return this.each(function(){
			var _this=this,
				$vvBox=$(vvBoxHtml.join("")),
				$vvBoxCon=$vvBox.find(".vvBox_content"),
				$vvBoxTitle=$vvBox.find(".vvBox_title"),
				$controlI=$vvBoxTitle.find(".control i"),
				$closeBtn=$controlI.filter(".close"),
				$restoreBtn=$controlI.filter(".restore"),
				$minBtn=$controlI.filter(".min"),
				$overlay=$(vvBoxOverlay),
				box={};//存储关于弹窗的方法和变量
				box.winL=box.winR=box.winT=box.winB=0;//弹窗相对视口的左右上下位置
				_this.box=$vvBox[0].box=box;
			
			box.exist=false;//判断是否已经有了相同的弹窗			
			//绑定事件
			$(this).click(function(){
				box.popup($(this).closest(".vvBox"));
			});
			//弹窗方法
			box.popup=function(pBox){
				if(box.exist) return;
				o.overlay&&addOverlay();
				loadData(pBox);
				o.drag&&drag();
				o.isResizePosition&&addResize();
				box.exist=true;	
			}
			//关闭并清除当前遮罩、弹窗、wrap、无用事件，以及子弹窗
			box.close=function(){
				var data=$vvBox.data("hasChildPopup")||[];
				if(data.length){
					$.each(data,function(i,ele){
						ele[0].box.close();
					});
				}
				o.overlay&&removeOverlay();
				removeVvBox();
				o.isResizePosition&&clearResize();
				box.exist=false;
			}
			//还原大小
			box.restore=function(){
				$vvBoxCon.stop().slideDown(function(){
	                $restoreBtn.hide();
	                $minBtn.show();
	                if(box.winR<20){fixedPopupWidth();}
	            });
			}
			//最小化窗口
			box.minimize=function(){
				autoPopupWidth();
				$vvBoxCon.stop().slideUp(function(){
	                $restoreBtn.show();
	                $minBtn.hide();
	            });
			}
			//添加遮罩层
			function addOverlay(){
				$overlay.css({"opacity":o.opacity,"z-index":zIndex++}).hide().appendTo("body").fadeIn(300);
			}
			//加载数据内容
			function loadData(pBox){
				if(pBox&&pBox.length){
					var arr=pBox.data("hasChildPopup")||[];
					$.merge(arr,[$vvBox]);
					$.unique(arr);
					pBox.data("hasChildPopup",arr);
				}
				$vvBox.appendTo("body").css({"z-index":zIndex}).show();
				$closeBtn.click(box.close);
				$restoreBtn.click(box.restore);
				$minBtn.click(box.minimize);
				//loading
				$vvBoxCon.empty().append("<div class='vvBox_loading'></div>");
				initPosition();
				if(o.reqType&&$.inArray(o.reqType,["ajax","iframe","img"])!=-1){
					//ajax
					if(o.reqType=="ajax"){
						$vvBoxCon.load(o.target,function(){
							initPosition();
							doCallBack();
						});
					}
					//iframe
					if(o.reqType=="iframe"){
						var $ifr=$("<iframe frameborder='0' scrolling='auto' width='"+o.iframeWH.width+"' height='"+o.iframeWH.height+"' src='"+o.target+"'></iframe> ").appendTo($vvBoxCon.empty());
						$ifr.load(function(){
							var iHeight=$ifr.contents().height(),
								iWidth=$ifr.contents().width(),
								w=$win.width()-30,
								h=$win.height()-30;
							if(iHeight>h){iHeight=h;}
							if(iWidth>w){iWidth=w;}
							$ifr.css({width:iWidth,height:iHeight});
							initPosition();
							doCallBack();
						});
					}
					//img
					if(o.reqType=="img"){
						var $img=$("<img src='"+o.target+"' />").appendTo($vvBoxCon.empty());
						$img.load(function(){
							initPosition();
							doCallBack();
						});
					}
				}else{
					if(o.target!=null){
						$vvBoxCon.empty().append($(o.target).clone());
					}else{
						if(o.html!=null){
							$vvBoxCon.html(o.html);
						}else{
							$vvBoxCon.empty().append($(_this).clone());
						}
					}
					initPosition();
					doCallBack();
				}	
			}
			//初始化弹窗位置
			function initPosition(){
				var vh=$vvBox.height(),vw=$vvBox.width(),
					dh=$(document).height(),dw=$(document).width(),
					wh=$win.height(),ww=$win.width(),
					l=(ww-vw)/2,
					dis=wh/9;
				if(dis+vh>wh-dis){
					dis=(wh-vh)/2;
					dis=reset(dis);
				}
				l=reset(l);
				var t=$win.scrollTop()+dis;
				$vvBox.css({"left":l,"top":t});
				box.winL=l;
				box.winR=ww-(l+vw);
				box.winT=t;
				box.winB=wh-(t+vh);
				setWinLRTB();
				if(box.winR<20){fixedPopupWidth();}
			}
			//重置窗口时弹窗位置设置
			function setPosition(){
				clearTimeout(box.timer)
				box.timer=setTimeout(function(){
					var vh=$vvBox.height(),vw=$vvBox.width(),
						dh=$(document).height(),dw=$(document).width(),
						wh=$win.height(),ww=$win.width(),
						offset=$vvBox.offset(),
						vBoxLeft=offset.left,
						vBoxRight=vBoxLeft+vw,
						vX=box.winL/(box.winR+box.winL),
						vY=box.winT/(box.winT+box.winB);
					box.winL=(ww-vw)*vX;
					box.winR=ww-vw-box.winL;
					box.winT=(wh-vh)*vY;
					box.winB=wh-vh-box.winT;
					setWinLRTB();
					$vvBox.css({"left":box.winL,"top":box.winT});
				},50);
			}
			//解决“拖动弹窗或改变窗口大小时，当弹窗接触到窗口边缘时有时会出现弹窗变形”的问题。
			function fixedPopupWidth(){
				$vvBox.css("width",$vvBox.width());
			}
			function autoPopupWidth(){
				$vvBox.css("width","auto");
			}
			//调整winLRTB
			function setWinLRTB(){
				$.each(["winL","winR","winT","winB"],function(i,ele){
					box[ele]=reset(box[ele],1);
				});
			}
			//拖拽
			function drag(){
				var $dragHandle=$vvBoxTitle.css("cursor","move"),
					l=0,t=0;
				$controlI.mousedown(function(){
	                return false;
	            });
				$dragHandle.mousedown(function(e){
					fixedPopupWidth();
					$vvBox.css({"z-index":++zIndex,opacity:0.8});
					var r=$win.width()-$vvBox.width(),
						b=$win.height()-$vvBox.height(),
						offset=$vvBox.offset(),
						disX=e.clientX-offset.left,
						disY=e.clientY-offset.top;
						r=reset(r);
						b=reset(b);
					$(document).on("mousemove.vvdrag",move).on("mouseup.vvdrag",up);
					$(document).trigger("click");
					function move(e){
						l=e.clientX-disX;
						t=e.clientY-disY;
						l=l<0?0:(l>r?r:l);
						t=t<0?0:(t>b?b:t);
						$vvBox.css({"left":l,"top":t});
						box.winL=l;
						box.winR=$win.width()-(l+$vvBox.width());
						box.winT=t;
						box.winB=$win.height()-(t+$vvBox.height());
						setWinLRTB();
					}
					function up(){
						if(box.winR>20){autoPopupWidth();}					
						$vvBox.css({"opacity":1.0});
						$(document).off(".vvdrag");
					}
					return false;
				}).on("selectstart",function(){return false;});
			}
			//调用回调函数
			function doCallBack(){
				typeof o.callBack==="function"?o.callBack($vvBox):$.noop();
			}
			//清除遮罩
			function removeOverlay(){
				$overlay.remove();
			}
			//清除弹窗
			function removeVvBox(){
				$vvBox.fadeOut(300,function(){
					$(this).remove();
				});
			}
			//设置resize事件
			function addResize(){
				$win.on("resize",setPosition);				
			}
			//清除resize事件
			function clearResize(){
				$win.off("resize",setPosition);
			}
		});
	};
	//reset
	function reset(n,m){
		var x=m||0;
		return n<x?x:n;
	}
	//判断插件是否加载过
	function isExist(){
		var bExist=$(document).data("vvbox")=="exist";
		bExist||$(document).data("vvbox","exist");
		return bExist;
	}
	//关闭所有弹窗--jQuery类函数
	$.closeAllVvBox=function(){
		$(".vvBox").each(function(){
			this.box.close();
		});
	}
})(jQuery);