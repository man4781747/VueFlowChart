function getPosition (S_id) {
  element = document.getElementById(S_id)
  var x = 0;
  var y = 0;
  // 搭配上面的示意圖可比較輕鬆理解為何要這麼計算
  while ( element ) {
    x += element.offsetLeft - element.scrollLeft + element.clientLeft;
    y += element.offsetTop - element.scrollLeft + element.clientTop;
    // 這邊有個重點，當父元素被下了 position 屬性之後他就會變成 offsetParent，所以這邊我們用迴圈不斷往上累加。
    element = element.offsetParent;
  }

  return { x: x, y: y };
}

function _uuid(){
	// 計算隨機的UUID當作唯一Key
	var d = Date.now();
		if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
			d += performance.now(); //use high-precision timer if available
		}
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		var r = (d + Math.random() * 16) % 16 | 0;
		d = Math.floor(d / 16);
		return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
	});
}

var app = new Vue({
	el: '#app',
	data: {
		svg_path_padding: 50,
		
		DrawCanvas: {
			width: 1500,
			height: 1000,
			border: 3,
		},

		BackgroundCanvasContextMenuInfo: {
			open: false,
			x: 0,
			y: 0,
		},
		
		alertList : {},

		canvasID : "draw-ground-canvas",
		
		taskCanvasMaskOpen: false,

		canvasTranslateX: 0,
		canvasTranslateY: 0,
		canvasScale: 1,
		D_taskList: {
			'169b184e-eefe-4aa5-9cd6-5fabed9e4c65': {
				'taskName':'start',
				'x': 10,
				'y': 10,
				'x_y': '',
				'lineList': {
					't':{},
					'b':{},
					'r':{},
					'l':{},
				},
				'trigger_rule':'all_done',
			},
			'f6e2fa5d-295b-4cf5-99f5-fb99be1f4dc7': {
				'taskName':'end',
				'x': 310,
				'y': 310,
				'x_y': '',
				'lineList': {
					't':{},
					'b':{},
					'r':{},
					'l':{},
				},
				'trigger_rule':'all_done',
			},

		},
		
		testLine: {
			'show':false,
			'x_1':0,
			'y_1':0,
			'x_2':0,
			'y_2':0,
		},
		
		D_pathList_ByItem: {
		},
		D_pathList:{},		
		S_pathChose:"",
		D_hoverList: {},
	},
	
	computed: {
		D_taskList_computed(){
			// for (S_taskID of Object.keys(this.D_taskList)){
				// this.D_taskList[S_taskID]['x_y'] = this.D_taskList[S_taskID]['x']+","+this.D_taskList[S_taskID]['y']
			// }
			console.log('123')
			return this.D_taskList
		},
		
		D_pathList_computed(){
			console.log('update')
			for (S_pathUuid of Object.keys(this.D_pathList)){
				S_fromKey = this.D_pathList[S_pathUuid]['from']
				S_toKey = this.D_pathList[S_pathUuid]['to']
				formXY = getPosition(S_fromKey)
				toXY = getPosition(S_toKey)
				
				this.D_pathList[S_pathUuid]['x_1'] = formXY.x
				this.D_pathList[S_pathUuid]['y_1'] = formXY.y
				this.D_pathList[S_pathUuid]['x_2'] = toXY.x
				this.D_pathList[S_pathUuid]['y_2'] = toXY.y
				
				
			}
			return this.D_pathList
		},
		
		D_getTaskProcessList(){
			var D_TaskProcessList = {}
			for (S_taskUuid of Object.keys(this.D_taskList)){
				D_TaskProcessList[S_taskUuid] = {
					'entryPoint': true,
					'taskName': this.D_taskList[S_taskUuid]['taskName'],
					'linkTo': {},
				}
			}
			
			for (S_taskUuid of Object.keys(this.D_taskList)){
				var S_taskName = this.D_taskList[S_taskUuid]['taskName']
				for (S_posi of ['t','b','r','l']){
					for (S_linkToUuid_ of Object.keys(
						this.D_taskList[S_taskUuid]['lineList'][S_posi]
					)){
						S_linkToUuid = S_linkToUuid_.slice(5)
						S_linkToTaskName = this.D_taskList[S_linkToUuid]['taskName']
						D_TaskProcessList[S_taskUuid]['linkTo'][S_linkToUuid] = S_linkToTaskName
						D_TaskProcessList[S_linkToUuid]['entryPoint'] = false
					}
				}
			}
			return D_TaskProcessList
		},
		
		D_canvasOffset(){
			canvasEle = document.getElementById(this.canvasID)
			return {
				'x': canvasEle.parentNode.offsetLeft,
				'y': canvasEle.parentNode.offsetTop,
			}
		},

		D_canvasSize(){
			canvasEle = document.getElementById(this.canvasID)
			return {
				'width': canvasEle.parentNode.clientWidth,
				'height': canvasEle.parentNode.clientHeight,
			}
		},

		D_settingJson(){
			return this.D_taskList
		},
	},
	
	methods: {
		addNewErrorAlert(S_content){
			var S_uuid = _uuid()
			Vue.set(this.alertList,S_uuid,
					{
						'content': S_content
					}
				)

			setTimeout(function() {
				Vue.delete(app.alertList,S_uuid)
			}, 4000);
		},

		updatePathDraw(S_taskChose){
			return null
			if (this.D_taskList[S_taskChose] == undefined){
				console.log('Lost Task!')
				return null
			}
			if (this.D_pathList_ByItem[S_taskChose] == undefined){
				Vue.set(
					this.D_pathList_ByItem,S_taskChose,{}
				)
			}
			for (S_LinkUuid of Object.keys(this.D_pathList_ByItem[S_taskChose])){
				var D_LinkItemInfo = this.D_pathList_ByItem[S_taskChose][S_LinkUuid]
				var S_startEleID = D_LinkItemInfo['from']
				var S_endEleID = D_LinkItemInfo['to']
				D_LinkItemInfo['x_1'] = getPosition(S_startEleID).x - 5
				D_LinkItemInfo['y_1'] = getPosition(S_startEleID).y - 5
				D_LinkItemInfo['x_2'] = getPosition(S_endEleID).x - 5
				D_LinkItemInfo['y_2'] = getPosition(S_endEleID).y - 5
			}
		},
		
		addNewTaskItem(x, y){
			Vue.set(
				this.D_taskList,
				_uuid(),
				{
					'taskName':'',
					'x': x,
					'y': y,
					'x_y': '',
					'lineList': {
						't':{},
						'b':{},
						'r':{},
						'l':{},
					},
					'trigger_rule':'all_done', 
				},
			)
		},
		
		delTaskItem(S_taskUuid){
			// 獲得此task所有相關的path uuid
			console.log('清除相關path')
			if (this.D_pathList_ByItem[S_taskUuid] != undefined){
				for (S_pathUuid of Object.keys(this.D_pathList_ByItem[S_taskUuid])){
					this.removePath(S_pathUuid)
				}
			}
		
			console.log('清除連線追中註冊資料')
			Vue.delete(this.D_pathList_ByItem, S_taskUuid);
			
			console.log('清除task物件')
			Vue.delete(this.D_taskList, S_taskUuid);
		},
		
		removePath(S_pathUuid){
			console.log(S_pathUuid)
			S_fromID = this.D_pathList[S_pathUuid].from.slice(5,-2)
			S_from_posi = this.D_pathList[S_pathUuid].from.slice(-1)

			S_toID = this.D_pathList[S_pathUuid].to.slice(5,-2)
			
			console.log("刪除連結:",S_fromID, S_from_posi, 'task_'+S_toID)
			Vue.delete(this.D_taskList[S_fromID]['lineList'][S_from_posi], 'task_'+S_toID);
			
			console.log("刪除連線圖案更新的註冊:",S_fromID, S_pathUuid)
			Vue.delete(this.D_pathList_ByItem[S_fromID], S_pathUuid);
			console.log("刪除連線圖案更新的註冊:",S_toID, S_pathUuid)
			Vue.delete(this.D_pathList_ByItem[S_toID], S_pathUuid);
			
			console.log("刪除連線資料:",S_pathUuid)
			Vue.delete(this.D_pathList, S_pathUuid);
		},
		
		clickTest(e){
			console.log('滑鼠絕對位置')
			console.log(e.clientX, e.clientY)
			console.log('滑鼠在棋盤位置')
			console.log(
				(e.clientX-this.D_canvasOffset.x-this.canvasTranslateX*this.canvasScale)/this.canvasScale,
				(e.clientY-this.D_canvasOffset.y-this.canvasTranslateY*this.canvasScale)/this.canvasScale
			)
		},
		
		getTaskLinkChain(Set_uuidLinks, S_checkedUuid){
			D_linkToList = this.D_getTaskProcessList[S_checkedUuid]['linkTo']
			for (S_linkToUuid of Object.keys(D_linkToList)){
				if (Set_uuidLinks.has(S_linkToUuid)){continue}
				Set_uuidLinks.add(S_linkToUuid)
				Set_nextSet = this.getTaskLinkChain(Set_uuidLinks,S_linkToUuid)
				Set_nextSet.forEach(Set_uuidLinks.add, Set_uuidLinks);
			}
			return Set_uuidLinks
		},
		
		clickPointerOnTaskItem(e, item, key, posi){
			var startEle = key
			var startItem = item
			var startItem_pos = posi
			var startX = e.clientX - this.canvasTranslateX + 3 - this.D_canvasOffset.x
			var startY = e.clientY - this.canvasTranslateY + 3 - this.D_canvasOffset.y
			this.testLine.x_1 = startX
			this.testLine.y_1 = startY
			this.testLine.x_2 = startX
			this.testLine.y_2 = startY
			console.log(key)
			
			this.testLine.show = true
			
			document.onmousemove = (e)=>{
                let endX = e.clientX - this.canvasTranslateX;    
                let endY = e.clientY - this.canvasTranslateY;
				app.testLine.x_2 = e.clientX - this.canvasTranslateX + 3 - this.D_canvasOffset.x     
				app.testLine.y_2 = e.clientY - this.canvasTranslateY + 3 - this.D_canvasOffset.y
			}
            document.onmouseup = (e) => {
                document.onmousemove = null;
                document.onmouseup = null;
				app.testLine.show = false
				L_elePath=e.path
				test = e.path[0]
				// 確認滑鼠放開時是否再連接處
				if (L_elePath[0].classList.toString().indexOf('svg-canvas-task-connect-point') == -1){
					return null
				}

				
				this.buildNewPathLink(
					'task_'+startEle+'_'+startItem_pos,
					L_elePath[0].id,
				)
            };
		},
		
		clearCanvas(){
			this.D_taskList = {}
			this.D_pathList_ByItem = {}
			this.D_pathList = {}	
			this.S_pathChose = ""
			this.D_hoverList = {}
		},

		buildNewPathLink(S_fromEleID,S_toEleID,loadSetting=false){
			S_fromUuid = S_fromEleID.slice(5,-2)
			S_toUuid = S_toEleID.slice(5,-2)

			// 確認連接處是否為自己
			if (S_fromUuid == S_toUuid){
				this.addNewErrorAlert('不允許自己連接自己')
				return null
			}
			// 確認連接對象是否連接過了(單向)
			for (S_posiKey of ['t','b','r','l']){
				if ((this.D_taskList[S_fromUuid]['lineList'][S_posiKey]['task_'+S_toUuid] != undefined)& 
					(loadSetting==false)
				){
					this.addNewErrorAlert('禁止重複連線')
					return null
				}
			}
			
			// 檢查迴圈
			Set_linkChain = this.getTaskLinkChain(new Set(),S_toUuid)
			if (Set_linkChain.has(S_fromUuid)) {
				console.log('偵測到迴圈可能，取消連接!')
				this.addNewErrorAlert('偵測到迴圈可能，取消連接')
				return null
			}


			S_pathUuid = _uuid()
			S_startItem_pos = S_fromEleID.slice(-1)
			Vue.set(
				this.D_taskList[S_fromUuid]['lineList'][S_startItem_pos],
				S_toEleID.slice(0,-2), 
				{
					'link_uuid': S_pathUuid,
					'link_to': S_toEleID,
				}
			)
			

			var S_startEleID = S_fromEleID
			var S_endEleID = S_toEleID
			var S_endEleID_Short = S_toEleID.slice(5)
			
			if (app.D_pathList_ByItem[S_fromUuid] == undefined){
				Vue.set(
					app.D_pathList_ByItem,S_fromUuid,{}
				)
			}
			if (app.D_pathList_ByItem[S_toUuid] == undefined){
				Vue.set(
					app.D_pathList_ByItem,S_toUuid,{}
				)
			}
			
			S_type = ''
			S_linkToPosi = S_toEleID.slice(-1)
			B_linkTo_t_or_b = (['t','b'].indexOf(S_linkToPosi)!=-1)
			
			B_linkFrom_t_or_b = (['t','b'].indexOf(S_startItem_pos)!=-1)
			
			if (S_linkToPosi==S_startItem_pos){
				S_type = "same-"+S_startItem_pos
			} 
			else if (B_linkTo_t_or_b == true & B_linkFrom_t_or_b == true){
				S_type = 't-b-pair'
			}
			else if (B_linkTo_t_or_b == false & B_linkFrom_t_or_b == false){
				S_type = 'r-l-pair'
			}
			else if (B_linkFrom_t_or_b == true & B_linkTo_t_or_b == false){
				S_type = 'face-side-pair'
			}
			else if (B_linkFrom_t_or_b == false & B_linkTo_t_or_b == true){
				S_type = 'side-face-pair'
			}
			
			getPosition_Start = getPosition(S_startEleID)
			getPosition_End = getPosition(S_endEleID)
			
			startPointXOnCanvas = Math.abs(getPosition_End.x-getPosition_Start.x)+26
			startPointYOnCanvas = Math.abs(getPosition_End.y-getPosition_Start.y)+26
			
			D_pointInfos = this.clacLinePathPoints(getPosition_Start, getPosition_End, S_type)
			// 建立link物件資訊
			var D_linkInfo = {
				'from': S_fromEleID,
				'to': S_toEleID,
				'startPointXOnCanvas':startPointXOnCanvas,
				'y_1':getPosition(S_startEleID).y,
				'x_2':getPosition(S_endEleID).x,
				'y_2':getPosition(S_endEleID).y,
				'uuid': S_pathUuid,
				'type': S_type,
				
			}
			
			D_linkInfo = {
				...D_linkInfo,
				...D_pointInfos
			}
			
			Vue.set(
				app.D_pathList,
				S_pathUuid,
				D_linkInfo
			)
			
			// 連線圖案更新的註冊
			Vue.set(
				app.D_pathList_ByItem[S_fromUuid],
				S_pathUuid,
				D_linkInfo
			)
			Vue.set(
				app.D_pathList_ByItem[S_toUuid],
				S_pathUuid,
				D_linkInfo
			)
			
			// app.updatePathDraw(startEle)
			// app.updatePathDraw(S_endEleID_Short)
			
			// console.log('Link: ' + 'task_'+startEle+"_"+startItem_pos + ' -> '+L_elePath[0].id)
			// console.log(D_linkInfo)
		},

		startDrag(e, item, key, posi){
			console.log(key, posi)
			var startX = e.clientX - this.canvasTranslateX
			var startY = e.clientY - this.canvasTranslateY
			this.testLine.x_1 = startX
			this.testLine.y_1 = startY
			this.testLine.x_2 = startX
			this.testLine.y_2 = startY
			console.log(key)
			
			this.testLine.show = true
			
			document.onmousemove = (e)=>{
                let endX = e.clientX - this.canvasTranslateX;    
                let endY = e.clientY - this.canvasTranslateY;
				app.testLine.x_2 = e.clientX - this.canvasTranslateX;       
				app.testLine.y_2 = e.clientY - this.canvasTranslateY;   
			}
            document.onmouseup = (e) => {
				console.log(e.path[0])
				L_elePath=e.path
				test = e.path[0]
				if (L_elePath[0].classList.toString().indexOf('svg-canvas-task-connect-point') != -1){
					console.log('OK')
				}
				
				
                document.onmousemove = null;
                document.onmouseup = null;
				app.testLine.show = false
            };
			
		},
		
		moveTaskItem(e, taskItem, taskKey){
			let disX = e.clientX - taskItem.x;
			let disY = e.clientY - taskItem.y;
			var taskItem = taskItem
			var taskKey = taskKey
			this.updatePathDraw(taskKey)
			document.onmousemove = (e)=>{
				
				// 滑鼠位置(絕對位置，不受縮放影響)
				// console.log(taskKey)
				
                let left = (e.clientX - disX)/this.canvasScale ;    
                let top = (e.clientY - disY)/this.canvasScale;

				var canvasEle = document.getElementById('task_'+taskKey)

				if (left < 0){
					left = 0
				} else if (left > this.DrawCanvas.width-canvasEle.clientWidth){
					left = this.DrawCanvas.width-canvasEle.clientWidth
				}				
				
				if (top < 0){
					top = 0
				} else if (top > this.DrawCanvas.height-canvasEle.clientHeight){
					top = this.DrawCanvas.height-canvasEle.clientHeight
				}


				taskItem.x = left
				taskItem.y = top
				app.updatePathDraw(taskKey)
			}
            document.onmouseup = (e) => {
				app.updatePathDraw(taskKey)
                document.onmousemove = null;
                document.onmouseup = null;
            };
		},
		
		moveRigthUpOnBackgroundCanvas(e){
			console.log("Right mouse up");
		},
		
		moveBackgroundCanvas(e){
            let disX = e.clientX - app.canvasTranslateX;
            let disY = e.clientY - app.canvasTranslateY;
			var endX, endY;
            document.onmousemove = (e)=>{       //鼠标按下并移动的事件
                //用鼠标的位置减去鼠标相对元素的位置，得到元素的位置
                let left = e.clientX - disX ;    
                let top = e.clientY - disY;
				if (left > 0){
					left = 0
				} else if (left < -this.DrawCanvas.width+this.D_canvasSize.width-this.DrawCanvas.border*2){
					left = -this.DrawCanvas.width+this.D_canvasSize.width-this.DrawCanvas.border*2
				}				
				// console.log(top)
				if (top > 0){
					top = 0
				} else if (top < -this.DrawCanvas.height+this.D_canvasSize.height-this.DrawCanvas.border*2){
					top = -this.DrawCanvas.height+this.D_canvasSize.height-this.DrawCanvas.border*2
				}
				app.canvasTranslateX = left
				app.canvasTranslateY = top
                // console.log(left + 'px')
            };
            document.onmouseup = (e) => {
                document.onmousemove = null;
                document.onmouseup = null;
            };
		},
		
		mousewheelBackgroundCanvas(e){
			return null
			this.canvasScale = this.canvasScale - (e.deltaY/1000)
			if (this.canvasScale < 0.5) {
				this.canvasScale = 0.5
			} else if (this.canvasScale > 3){
				this.canvasScale = 3
			}
		},
		
		clacLinePathPoints(D_start, D_end, S_type){
			// D_start.x = D_start.x - 5
			// D_start.y = D_start.y - 20
			// D_end.x = D_end.x - 5
			// D_end.y = D_end.y - 20
			
			startPointXOnCanvas = Math.abs(D_end.x-D_start.x) + this.svg_path_padding
			startPointYOnCanvas = Math.abs(D_end.y-D_start.y) + this.svg_path_padding
			endPointXOnCanvas   = Math.abs(D_end.x-D_start.x)+(D_end.x-D_start.x) + this.svg_path_padding
			endPointYOnCanvas   = Math.abs(D_end.y-D_start.y)+(D_end.y-D_start.y) + this.svg_path_padding
			D_linkInfo = {
				'bg_left': (D_start.x)-Math.abs(D_end.x-D_start.x)-this.svg_path_padding- this.D_canvasOffset.x - this.DrawCanvas.border + 4,
				'bg_top': (D_start.y)-Math.abs(D_end.y-D_start.y)-this.svg_path_padding - this.D_canvasOffset.y - this.DrawCanvas.border + 4,
				'bg_width': 2*Math.abs(D_end.x-D_start.x)+this.svg_path_padding*2,
				'bg_height': 2*Math.abs(D_end.y-D_start.y)+this.svg_path_padding*2,
				
				'start_x': startPointXOnCanvas,
				'start_y': startPointYOnCanvas,
				'end_x': endPointXOnCanvas,
				'end_y': endPointYOnCanvas,
			}
			if (S_type=='r-l-pair'){
				D_linkInfo['mid_x'] = (startPointXOnCanvas+endPointXOnCanvas)/2
				D_linkInfo['mid_y'] = (startPointYOnCanvas+endPointYOnCanvas)/2
				D_linkInfo['q_x'] = startPointXOnCanvas+(endPointXOnCanvas-startPointXOnCanvas)/2
				D_linkInfo['q_y'] = startPointYOnCanvas+(endPointYOnCanvas-startPointYOnCanvas)/8
			} else if (S_type=='t-b-pair'){
				D_linkInfo['mid_x'] = (startPointXOnCanvas+endPointXOnCanvas)/2
				D_linkInfo['mid_y'] = (startPointYOnCanvas+endPointYOnCanvas)/2
				D_linkInfo['q_x'] = startPointXOnCanvas+(endPointXOnCanvas-startPointXOnCanvas)/8
				D_linkInfo['q_y'] = startPointYOnCanvas+(endPointYOnCanvas-startPointYOnCanvas)/2
			} else if (S_type=='face-side-pair'){
				D_linkInfo['mid_x'] = startPointXOnCanvas
				if (endPointYOnCanvas > startPointYOnCanvas){
					D_linkInfo['mid_y'] = endPointYOnCanvas - 15
				} else {
					D_linkInfo['mid_y'] = endPointYOnCanvas + 15
				}
				D_linkInfo['q_x'] = startPointXOnCanvas
				D_linkInfo['q_y'] = endPointYOnCanvas
				
				D_linkInfo['mid_y_2'] = endPointYOnCanvas
				if (endPointXOnCanvas > startPointXOnCanvas){
					D_linkInfo['mid_x_2'] = startPointXOnCanvas + 15
				} else {
					D_linkInfo['mid_x_2'] = startPointXOnCanvas - 15
				}
			} else if (S_type=='side-face-pair'){
				D_linkInfo['mid_y'] = startPointYOnCanvas
				if (endPointXOnCanvas > startPointXOnCanvas){
					D_linkInfo['mid_x'] = endPointXOnCanvas - 15
				} else {
					D_linkInfo['mid_x'] = endPointXOnCanvas + 15
				}
				D_linkInfo['q_x'] = endPointXOnCanvas
				D_linkInfo['q_y'] = startPointYOnCanvas
				
				D_linkInfo['mid_x_2'] = endPointXOnCanvas
				if (endPointYOnCanvas > startPointYOnCanvas){
					D_linkInfo['mid_y_2'] = startPointYOnCanvas + 15
				} else {
					D_linkInfo['mid_y_2'] = startPointYOnCanvas - 15
				}
			} else if (S_type=='same-t'){
				D_linkInfo['mid_x'] = startPointXOnCanvas
				D_linkInfo['mid_y'] = Math.min(startPointYOnCanvas, endPointYOnCanvas) - 15
				D_linkInfo['q_x'] = startPointXOnCanvas
				D_linkInfo['q_y'] = Math.min(startPointYOnCanvas, endPointYOnCanvas) - 30
				D_linkInfo['mid_y_2'] = Math.min(startPointYOnCanvas, endPointYOnCanvas) - 30
				if (endPointXOnCanvas > startPointXOnCanvas){
					D_linkInfo['mid_x_2'] = startPointXOnCanvas + 15
				} else {
					D_linkInfo['mid_x_2'] = startPointXOnCanvas - 15
				}
				
				D_linkInfo['mid_y_3'] = Math.min(startPointYOnCanvas, endPointYOnCanvas)  - 30
				if (endPointXOnCanvas > startPointXOnCanvas){
					D_linkInfo['mid_x_3'] = endPointXOnCanvas - 15
				} else {
					D_linkInfo['mid_x_3'] = endPointXOnCanvas + 15
				}
				D_linkInfo['q_x_2'] = endPointXOnCanvas
				D_linkInfo['q_y_2'] = Math.min(startPointYOnCanvas, endPointYOnCanvas)  - 30
				
				D_linkInfo['mid_y_4'] = Math.min(startPointYOnCanvas, endPointYOnCanvas) - 15
				D_linkInfo['mid_x_4'] = endPointXOnCanvas
			} else if (S_type=='same-b'){
				D_linkInfo['mid_x'] = startPointXOnCanvas
				D_linkInfo['mid_y'] = Math.max(startPointYOnCanvas, endPointYOnCanvas) + 15
				D_linkInfo['q_x'] = startPointXOnCanvas
				D_linkInfo['q_y'] = Math.max(startPointYOnCanvas, endPointYOnCanvas) + 30
				D_linkInfo['mid_y_2'] = Math.max(startPointYOnCanvas, endPointYOnCanvas) + 30
				if (endPointXOnCanvas > startPointXOnCanvas){
					D_linkInfo['mid_x_2'] = startPointXOnCanvas + 15
				} else {
					D_linkInfo['mid_x_2'] = startPointXOnCanvas - 15
				}
				
				D_linkInfo['mid_y_3'] = Math.max(startPointYOnCanvas, endPointYOnCanvas)  + 30
				if (endPointXOnCanvas > startPointXOnCanvas){
					D_linkInfo['mid_x_3'] = endPointXOnCanvas - 15
				} else {
					D_linkInfo['mid_x_3'] = endPointXOnCanvas + 15
				}
				D_linkInfo['q_x_2'] = endPointXOnCanvas
				D_linkInfo['q_y_2'] = Math.max(startPointYOnCanvas, endPointYOnCanvas) + 30
				
				D_linkInfo['mid_y_4'] = Math.max(startPointYOnCanvas, endPointYOnCanvas) + 15
				D_linkInfo['mid_x_4'] = endPointXOnCanvas
			} else if (S_type=='same-r'){
				D_linkInfo['mid_x'] = Math.max(startPointXOnCanvas, endPointXOnCanvas) + 15
				D_linkInfo['mid_y'] = startPointYOnCanvas
				D_linkInfo['q_x'] = Math.max(startPointXOnCanvas, endPointXOnCanvas) + 30
				D_linkInfo['q_y'] = startPointYOnCanvas
				D_linkInfo['mid_x_2'] = Math.max(startPointXOnCanvas, endPointXOnCanvas) + 30
				
				if (endPointYOnCanvas > startPointYOnCanvas){
					D_linkInfo['mid_y_2'] = startPointYOnCanvas + 15
				} else {
					D_linkInfo['mid_y_2'] = startPointYOnCanvas - 15
				}
				
				D_linkInfo['mid_x_3'] = Math.max(startPointXOnCanvas, endPointXOnCanvas) + 30
				if (endPointYOnCanvas > startPointYOnCanvas){
					D_linkInfo['mid_y_3'] = endPointYOnCanvas - 15
				} else {
					D_linkInfo['mid_y_3'] = endPointYOnCanvas + 15
				}
				D_linkInfo['q_x_2'] = Math.max(startPointXOnCanvas, endPointXOnCanvas) + 30
				D_linkInfo['q_y_2'] = endPointYOnCanvas
				
				D_linkInfo['mid_x_4'] = Math.max(startPointXOnCanvas, endPointXOnCanvas) + 15
				D_linkInfo['mid_y_4'] = endPointYOnCanvas
			} else if (S_type=='same-l'){
				D_linkInfo['mid_x'] = Math.min(startPointXOnCanvas, endPointXOnCanvas) - 15
				D_linkInfo['mid_y'] = startPointYOnCanvas
				D_linkInfo['q_x'] = Math.min(startPointXOnCanvas, endPointXOnCanvas) - 30
				D_linkInfo['q_y'] = startPointYOnCanvas
				D_linkInfo['mid_x_2'] = Math.min(startPointXOnCanvas, endPointXOnCanvas) - 30
				
				if (endPointYOnCanvas > startPointYOnCanvas){
					D_linkInfo['mid_y_2'] = startPointYOnCanvas + 15
				} else {
					D_linkInfo['mid_y_2'] = startPointYOnCanvas - 15
				}
				
				D_linkInfo['mid_x_3'] = Math.min(startPointXOnCanvas, endPointXOnCanvas) - 30
				if (endPointYOnCanvas > startPointYOnCanvas){
					D_linkInfo['mid_y_3'] = endPointYOnCanvas - 15
				} else {
					D_linkInfo['mid_y_3'] = endPointYOnCanvas + 15
				}
				D_linkInfo['q_x_2'] = Math.min(startPointXOnCanvas, endPointXOnCanvas) - 30
				D_linkInfo['q_y_2'] = endPointYOnCanvas
				
				D_linkInfo['mid_x_4'] = Math.min(startPointXOnCanvas, endPointXOnCanvas) - 15
				D_linkInfo['mid_y_4'] = endPointYOnCanvas
			}
			
			
			
			
			return D_linkInfo
		},

		taskItemOverIn(S_taskUuid){
			this.taskCanvasMaskOpen = true
			var D_hoverList = {}
			D_hoverList[S_taskUuid] = 'main'
			if (this.D_pathList_ByItem[S_taskUuid] != undefined){
				for (S_pathUuid of Object.keys(this.D_pathList_ByItem[S_taskUuid])){
					S_fromTask = this.D_pathList[S_pathUuid].from.slice(5,-2)
					S_toTask = this.D_pathList[S_pathUuid].to.slice(5,-2)
					if (S_fromTask == S_taskUuid){
						D_hoverList[S_toTask] = 'after_task'
						D_hoverList[S_pathUuid] = 'out_path'
					} else {
						D_hoverList[S_fromTask] = 'after_task'
						D_hoverList[S_pathUuid] = 'in_path'
					}
				}
			}
			this.D_hoverList = D_hoverList
		},

		loadSettingJson(D_settingJson){
			this.clearCanvas()
			this.D_taskList = D_settingJson
			for (S_taskFromUuid of Object.keys(this.D_taskList)){
				for (S_posi of ['b','l','r','t']){
					if (this.D_taskList[S_taskFromUuid]['lineList'][S_posi] == undefined){
						continue
					}
					for (S_taskToEleID of Object.keys(this.D_taskList[S_taskFromUuid]['lineList'][S_posi])){
						S_linkToEleID = this.D_taskList[S_taskFromUuid]['lineList'][S_posi][S_taskToEleID]['link_to']
						S_linkFromEleID = 'task_'+S_taskFromUuid+'_'+S_posi
						this.buildNewPathLink(S_linkFromEleID,S_linkToEleID, true)
					}
				}
			}
		},

		startDragNewTaskItem(e){
			// console.log(e)
		},
		onDrop(e){
			console.log(e)	
			this.addNewTaskItem(
				e.clientX - this.D_canvasOffset.x,
				e.clientY - this.D_canvasOffset.y,
			)
		}
	},
	
	updated(){
		for (S_pathUuid of Object.keys(this.D_pathList)){
			S_fromKey = this.D_pathList[S_pathUuid]['from']
			S_toKey = this.D_pathList[S_pathUuid]['to']
			formXY = getPosition(S_fromKey)
			toXY = getPosition(S_toKey)
			// console.log(this.D_pathList[S_pathUuid])
			D_newLineInfos = this.clacLinePathPoints(formXY, toXY, this.D_pathList[S_pathUuid]['type'])
			// console.log(D_newLineInfos)
			for (S_key of Object.keys(D_newLineInfos)){
				this.D_pathList[S_pathUuid][S_key] = D_newLineInfos[S_key]
			}
			// console.log(this.D_pathList[S_pathUuid])
			

		}
	
	},
	
})

var test