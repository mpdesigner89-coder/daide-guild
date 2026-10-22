/* MODULE 4 — AUCTION DEMO
 * Quản lý giao diện phiên đấu giá, nhập giá tùy ý, bước giá tối thiểu,
 * lịch sử và kết thúc phiên. Dữ liệu đấu giá đang lưu localStorage trên máy
 * hiện tại; không có tính đồng bộ, khóa giao dịch hay xác thực server.
 * Trước khi dùng thật, chuyển mọi thao tác ra API backend có kiểm tra quyền
 * và xử lý giá đấu nguyên tử (transaction/locking).
 */
/* V23: khung bình luận gọn ở giữa, nút ẩn/hiện và sàn đấu giá Kim đỉnh (bản demo). */
(()=>{
  const extraStyle=document.createElement('style');
  extraStyle.textContent=`
    .community-dock{left:50%!important;right:auto!important;bottom:14px!important;transform:translateX(-50%);width:min(590px,calc(100vw - 24px));max-height:34vh!important;border-radius:14px!important;display:none!important}
    .community-dock.visible{display:flex!important}
    .community-dock .community-feed{max-height:calc(34vh - 125px);padding:7px 10px;gap:6px}
    .community-dock .community-comment{padding:6px;grid-template-columns:28px minmax(0,1fr);gap:7px}
    .community-dock .community-avatar{width:27px;height:27px;border-radius:8px}
    .community-dock .community-text{font-size:11px;margin-top:2px}
    .community-dock .community-images img{width:48px;height:40px}
    .community-dock .community-compose{padding:7px 9px;grid-template-columns:minmax(0,1fr) auto;gap:6px}
    .community-dock .community-compose textarea{min-height:32px;max-height:55px}
    .community-toggle{position:fixed;z-index:51;left:50%;bottom:12px;transform:translateX(-50%);border:1px solid #d9e2ef;border-radius:999px;background:#183b72;color:#fff;padding:9px 16px;font-weight:800;box-shadow:0 8px 24px #10182830;display:none}
    .community-toggle.show{display:block}
    .auction-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
    .auction-card{border:1px solid var(--line);background:var(--panel);border-radius:15px;padding:16px;min-width:0}
    .auction-icon{height:105px;border-radius:12px;background:linear-gradient(135deg,#eef3ff,#fff4d7);display:grid;place-items:center;font-size:42px;margin-bottom:12px}
    .auction-card h3{margin:0 0 6px;font-size:16px}
    .auction-price{font-size:21px;font-weight:900;color:#98620c;margin:10px 0}
    .auction-meta{font-size:11px;color:var(--muted);line-height:1.7}
    .auction-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}
    .auction-admin{margin-bottom:16px}
    .auction-fund{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:15px}
    .auction-fund .kpi-value{font-size:20px}
    .auction-log{font-size:11px;color:var(--muted);line-height:1.6;margin-top:10px}
    @media(max-width:760px){.community-dock{bottom:8px!important;max-height:40vh!important}.community-dock .community-feed{max-height:calc(40vh - 125px)}.auction-grid{grid-template-columns:1fr}.auction-fund{grid-template-columns:1fr}.community-dock .community-compose{grid-template-columns:1fr}}
  `;
  document.head.appendChild(extraStyle);
  let toggle=document.getElementById('communityToggle');
  if(!toggle){toggle=document.createElement('button');toggle.id='communityToggle';toggle.className='community-toggle';toggle.textContent='💬 Bình luận';toggle.type='button';document.body.appendChild(toggle);}
  let communityExpanded=false;
  const syncCommunityToggle=()=>{const dock=document.getElementById('communityDock');const visible=!!dock&&dock.classList.contains('visible');toggle.classList.toggle('show',!visible);toggle.textContent=visible?'':'💬 Bình luận · '+Math.max(0,communityComments.length-Number(sessionStorage.getItem('daide-comments-seen')||0))+' mới';};
  toggle.addEventListener('click',()=>{const dock=document.getElementById('communityDock');if(dock){communityExpanded=true;dock.classList.add('visible');sessionStorage.setItem('daide-comments-seen',String(communityComments.length));renderCommunityComments();syncCommunityToggle();}});
  const oldRenderComments=renderCommunityComments;
  renderCommunityComments=function(){oldRenderComments();const dock=document.getElementById('communityDock');if(dock){if(!communityExpanded)dock.classList.remove('visible');if(!document.getElementById('communityHide')){const head=dock.querySelector('.community-head');if(head){const b=document.createElement('button');b.id='communityHide';b.className='btn btn-small';b.type='button';b.textContent='Ẩn';head.appendChild(b);b.addEventListener('click',()=>{communityExpanded=false;dock.classList.remove('visible');syncCommunityToggle();});}}const hide=dock.querySelector('#communityHide');if(hide&&!hide.dataset.bound){hide.dataset.bound='1';hide.addEventListener('click',()=>{communityExpanded=false;dock.classList.remove('visible');syncCommunityToggle();});}}syncCommunityToggle();};
  /* Khách chưa đăng nhập vẫn thấy khung bình luận gọn và có thể ẩn/hiện lời nhắc. */
  const communityRendererWithGuestHint=renderCommunityComments;
  renderCommunityComments=function(){communityRendererWithGuestHint();if(!demoLoggedIn){const d=document.getElementById('communityDock');if(d){d.classList.remove('visible');d.innerHTML='<div class="community-head"><div><h3>💬 Bình luận bang hội</h3><small>Đăng nhập để xem và gửi bình luận</small></div><button id="communityGuestHide" class="btn btn-small" type="button">Ẩn</button></div><div class="community-login-hint">Khu bình luận dành cho thành viên đã đăng nhập. Bản xem trước chưa xác thực tài khoản thật.</div>';d.querySelector('#communityGuestHide').addEventListener('click',()=>{communityExpanded=false;d.classList.remove('visible');syncCommunityToggle();});}}syncCommunityToggle();};
  document.getElementById('communityDock')?.classList.remove('visible');syncCommunityToggle();
  /* Thêm mục điều hướng theo cơ chế data-page hiện có. */
  const nav=document.querySelector('.nav');
  if(nav&&!nav.querySelector('[data-page="auction"]')){const b=document.createElement('button');b.dataset.page='auction';b.innerHTML='<span class="nav-icon">♜</span> Đấu giá vật phẩm';nav.appendChild(b);b.addEventListener('click',()=>{document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id==='page-auction'));document.querySelectorAll('.nav button').forEach(n=>n.classList.toggle('active',n===b));const title=document.getElementById('pageTitle'),sub=document.getElementById('pageSubtitle');if(title)title.textContent='Đấu giá vật phẩm';if(sub)sub.textContent='Sàn đấu giá Kim đỉnh · nguồn thu bổ sung cho quỹ lương';renderAuction();});}
  const main=document.querySelector('.main');
  if(main&&!document.getElementById('page-auction')){const page=document.createElement('section');page.className='page';page.id='page-auction';page.innerHTML=`
    <div class="hero"><div class="hero-copy"><h2>Sàn đấu giá bang hội</h2><p>Đấu giá vật phẩm bằng Kim đỉnh. Các khoản đấu giá hoàn tất được ghi nhận vào nguồn thu và quỹ lương bang hội.</p><div class="hero-tags"><span class="hero-tag">✦ Đơn vị: Kim đỉnh</span><span class="hero-tag">♜ Thành viên đã đăng nhập mới được đấu</span></div></div><div class="hero-mark">♜</div></div>
    <div class="auction-fund" id="auctionFundStats"></div>
    <div class="panel auction-admin"><div class="panel-head"><div><h3>Quản trị phiên đấu giá</h3><small>Chọn thời lượng và tạo phiên mới cho vật phẩm mặc định.</small></div><span class="pill gold">Bản demo</span></div>
      <form id="auctionCreateForm" class="form-grid"><div class="field"><label>Vật phẩm</label><select name="item"><option>Tẩy tủy kinh</option><option>Võ lâm mật tịch</option></select></div><div class="field"><label>Thời lượng phiên</label><select name="duration"><option value="5">5 phút (thử nghiệm)</option><option value="30">30 phút</option><option value="60">1 giờ</option><option value="180">3 giờ</option><option value="1440">24 giờ</option><option value="4320">3 ngày</option></select></div><div class="field"><label>Giá khởi điểm (Kim đỉnh)</label><input name="start" type="number" min="1" step="1" value="100" required></div><div class="field"><label>Bước giá tối thiểu</label><input name="step" type="number" min="1" step="1" value="10" required></div><div style="grid-column:1/-1"><button class="btn btn-primary" type="submit">＋ Mở phiên đấu giá</button></div></form>
      <div class="notice warn">Trong bản xem trước, phần quản trị chỉ mô phỏng. Khi kết nối hệ thống thật, quyền tạo/đóng phiên phải được kiểm tra ở máy chủ theo vai trò quản trị.</div>
    </div>
    <div class="section-head"><div><h2>Vật phẩm đang đấu giá</h2><p>Giá cao nhất, người dẫn đầu và thời gian còn lại được cập nhật tự động.</p></div></div><div class="auction-grid" id="auctionLots"></div>
    <div class="section-head"><div><h2>Lịch sử thu quỹ đấu giá</h2><p>Chỉ phiên đã kết thúc mới được tính vào khoản thu đã chốt.</p></div></div><div class="panel"><div class="table-wrap"><table><thead><tr><th>Vật phẩm</th><th>Người thắng</th><th>Giá chốt</th><th>Thời điểm kết thúc</th></tr></thead><tbody id="auctionHistory"></tbody></table></div><p class="auction-log">Lưu ý: dữ liệu phiên được lưu cục bộ trên trình duyệt này để thử giao diện; chưa đồng bộ giữa thành viên và chưa phải giao dịch Kim đỉnh thật.</p></div>`;main.appendChild(page);}
  let auctionAdmin=false;
  const storageKey='daide-auction-demo-v1';
  window.addEventListener('daide:role',e=>{document.querySelectorAll('.auction-admin').forEach(el=>el.hidden=!e.detail.admin);auctionAdmin=e.detail.admin;});
  const loadAuction=()=>{try{return JSON.parse(localStorage.getItem(storageKey)||'null')}catch(e){return null}};
  let auctionState=loadAuction()||{lots:[{id:1,item:'Tẩy tủy kinh',start:100,step:10,highest:100,bidder:'',end:Date.now()+30*60000,closed:false},{id:2,item:'Võ lâm mật tịch',start:100,step:10,highest:100,bidder:'',end:Date.now()+60*60000,closed:false}],history:[],nextId:3};
  const saveAuction=()=>{try{localStorage.setItem(storageKey,JSON.stringify(auctionState))}catch(e){}};
  const fmtKim=n=>Math.round(Number(n)||0).toLocaleString('vi-VN')+' Kim đỉnh';
  const renderAuction=()=>{
    const fund=document.getElementById('auctionFundStats');if(!fund)return;
    const total=auctionState.history.reduce((s,x)=>s+x.price,0),active=auctionState.lots.filter(x=>!x.closed).length;
    fund.innerHTML=`<div class="kpi"><div class="kpi-top">Thu đấu giá đã chốt</div><div class="kpi-value">${fmtKim(total)}</div><div class="kpi-note">Đã cộng vào nguồn thu/quỹ lương demo</div></div><div class="kpi"><div class="kpi-top">Phiên đang mở</div><div class="kpi-value">${active}</div><div class="kpi-note">Có thể tiếp tục ra giá</div></div><div class="kpi"><div class="kpi-top">Lịch sử giao dịch</div><div class="kpi-value">${auctionState.history.length}</div><div class="kpi-note">Phiên đã kết thúc</div></div>`;
    const lots=document.getElementById('auctionLots');
    lots.innerHTML=auctionState.lots.map(l=>{const left=Math.max(0,l.end-Date.now()),remaining=left?`${Math.floor(left/3600000)} giờ ${Math.floor(left%3600000/60000)} phút ${Math.floor(left%60000/1000)} giây`:'Đã hết giờ',minBid=l.bidder?l.highest+l.step:l.start;return `<article class="auction-card"><div class="auction-icon">${l.item==='Tẩy tủy kinh'?'📜':'📘'}</div><h3>${esc(l.item)}</h3><span class="pill ${l.closed?'gray':'green'}">${l.closed?'Đã kết thúc':'Đang mở đấu giá'}</span><div class="auction-price">${fmtKim(l.highest)}</div><div class="auction-meta">Giá khởi điểm: ${fmtKim(l.start)}<br>Bước giá tối thiểu: ${fmtKim(l.step)}<br>Người đang dẫn: ${esc(l.bidder||'Chưa có người ra giá')}<br>Thời gian còn lại: <strong>${remaining}</strong></div><div class="auction-actions">${!l.closed?`<label for="auctionBidAmount-${l.id}">Nhập giá muốn đấu (Kim đỉnh)</label><input id="auctionBidAmount-${l.id}" type="number" min="${minBid}" step="1" value="${minBid}" style="width:100%;margin:8px 0 10px;padding:10px;border:1px solid var(--line);border-radius:9px"/><small>Giá tối thiểu hợp lệ: ${fmtKim(minBid)}</small><button class="btn btn-primary btn-small" data-auction-bid="${l.id}">Xác nhận ra giá</button>${auctionAdmin?`<button class="btn btn-small" data-auction-close="${l.id}">Quản trị: kết thúc</button>`:""}`:'<span class="pill gray">Đã chốt quỹ</span>'}</div></article>`}).join('')||'<div class="empty">Chưa có phiên đấu giá.</div>';
    document.getElementById('auctionHistory').innerHTML=auctionState.history.slice().reverse().map(h=>`<tr><td>${esc(h.item)}</td><td>${esc(h.bidder||'Không có người thắng')}</td><td><strong>${fmtKim(h.price)}</strong></td><td>${esc(new Date(h.closedAt).toLocaleString('vi-VN'))}</td></tr>`).join('')||'<tr><td colspan="4" class="empty">Chưa có khoản thu đấu giá được chốt.</td></tr>';
  };
  const closeLot=(lot)=>{if(lot.closed)return;lot.closed=true;lot.closedAt=Date.now();if(lot.bidder)auctionState.history.push({id:lot.id,item:lot.item,bidder:lot.bidder,price:lot.highest,closedAt:lot.closedAt});saveAuction();renderAuction();};
  document.addEventListener('submit',e=>{if(e.target.id!=='auctionCreateForm')return;e.preventDefault();if(!auctionAdmin){showToast('Chỉ Admin được tạo phiên đấu giá.');return;}const f=new FormData(e.target),item=String(f.get('item')),duration=Number(f.get('duration')),start=Number(f.get('start')),step=Number(f.get('step'));if(!(start>0&&step>0&&duration>0)){showToast('Vui lòng nhập giá và thời lượng hợp lệ.');return;}auctionState.lots.push({id:auctionState.nextId++,item,start,step,highest:start,bidder:'',end:Date.now()+duration*60000,closed:false});saveAuction();renderAuction();showToast('Đã mở phiên đấu giá demo.');e.target.reset();});
  document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.auctionBid){if(!demoLoggedIn){showToast('Vui lòng đăng nhập trước khi đấu giá.');return;}const l=auctionState.lots.find(x=>x.id===Number(b.dataset.auctionBid));if(!l||l.closed)return;if(Date.now()>=l.end){closeLot(l);showToast('Phiên đã hết giờ và được chốt.');return;}const bidder=demoCommentUser?.name||'Thành viên demo',input=document.getElementById('auctionBidAmount-'+l.id),amount=Number(input?.value),minBid=l.bidder?l.highest+l.step:l.start;if(l.bidder===bidder){showToast('Bạn đang là người dẫn đầu phiên này.');return;}if(!Number.isSafeInteger(amount)||amount<minBid){showToast('Giá đấu phải là số nguyên và không thấp hơn '+fmtKim(minBid)+'.');input?.focus();return;}l.highest=amount;l.bidder=bidder;saveAuction();renderAuction();showToast('Đã ghi nhận giá đấu '+fmtKim(amount)+' (demo).');return;}if(b.dataset.auctionClose){if(!auctionAdmin){showToast('Chỉ Admin được kết thúc phiên.');return;}const l=auctionState.lots.find(x=>x.id===Number(b.dataset.auctionClose));if(l&&!l.closed){openModal('Xác nhận kết thúc đấu giá','<p>Kết thúc phiên này và chốt khoản thu vào quỹ lương demo?</p>',()=>{closeLot(l);return true;});document.getElementById('modalSave').textContent='Xác nhận kết thúc';}}});
  /* Khi hết giờ, tự đóng phiên; tổng thu chỉ tăng sau khi phiên có người thắng được chốt. */
  setInterval(()=>{let changed=false;auctionState.lots.forEach(l=>{if(!l.closed&&Date.now()>=l.end){l.closed=true;l.closedAt=Date.now();if(l.bidder)auctionState.history.push({id:l.id,item:l.item,bidder:l.bidder,price:l.highest,closedAt:l.closedAt});changed=true;}});if(changed)saveAuction();renderAuction();},1000);
  const oldNavClick=document.querySelector('.nav');
  oldNavClick?.addEventListener('click',e=>{if(e.target.closest('[data-page="auction"]')){setTimeout(()=>{const title=document.getElementById('pageTitle');const sub=document.getElementById('pageSubtitle');if(title)title.textContent='Đấu giá vật phẩm';if(sub)sub.textContent='Sàn đấu giá Kim đỉnh · nguồn thu bổ sung cho quỹ lương';renderAuction();},0);}});
  renderAuction();
})();
