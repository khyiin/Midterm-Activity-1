'use strict';
(() => {
 const $ = s => document.querySelector(s);
 const money = v => '$' + v.toFixed(2);
 const key = 'havena-bag-v1', prefix = 'havena-tab-v1:';
 const disk = location.protocol === 'file:';
 let bag = [];
 try {
  const raw = disk ? (window.name.startsWith(prefix) ? window.name.slice(prefix.length) : '[]') : sessionStorage.getItem(key) || '[]';
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) bag = parsed.filter(row => products.some(p => p.id === row.id) && Number.isInteger(row.quantity) && row.quantity > 0).map(row => ({id:row.id, quantity: Math.min(row.quantity,999)}));
 } catch { bag = []; }
 const items = () => bag.map(row => ({...products.find(p => p.id === row.id), quantity:row.quantity}));
 function save() {
  try { if (disk) window.name = prefix + JSON.stringify(bag); else sessionStorage.setItem(key, JSON.stringify(bag)); } catch { /* In-memory cart still works if storage is restricted. */ }
  updateCount();
 }
 function updateCount() {
  const n = bag.reduce((sum,p) => sum+p.quantity,0);
  document.querySelectorAll('[data-cart-link]').forEach(a => { a.setAttribute('aria-label', `Cart, ${n} items`); a.querySelector('span').textContent = 'Cart' + (n ? ` (${n})` : ''); });
 }
 const mobile = $('.mobile-nav'), toggle = $('.mobile-toggle');
 toggle.addEventListener('click', () => {mobile.hidden = !mobile.hidden; toggle.setAttribute('aria-expanded',String(!mobile.hidden)); toggle.setAttribute('aria-label',mobile.hidden?'Open menu':'Close menu');});
 document.addEventListener('keydown',e=> {if(e.key==='Escape'){mobile.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open menu');}});
 const modal = $('#shop-dialog'), content = $('#modal-content'), title = $('#modal-title');
 $('.modal-close').addEventListener('click',()=>modal.close());
 modal.addEventListener('click',e=> {if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modal.close();}});
 function openProduct(id) {
  const p = products.find(p=>p.id===id); if(!p)return;
  title.textContent=p.name;
  content.innerHTML=`<div class="product-detail"><img src="${p.image}" alt="${p.name}" width="512" height="512"><div class="detail-copy"><p class="detail-price">${money(p.price)}</p><p>${p.description}</p><button class="store-button" data-add="${p.id}">Add to Bag</button></div></div>`;
  if(!modal.open)modal.showModal();
 }
 function result(p) {return `<button class="result-button" data-product="${p.id}"><img src="${p.image}" alt="" width="64" height="64"><span>${p.name}<br>${money(p.price)}</span><span aria-hidden="true">→</span></button>`;}
 $('[data-search-open]').addEventListener('click',()=> {
  title.textContent='Find Your Next Favorite';
  content.innerHTML='<input class="search-input" type="search" aria-label="Search the collection" placeholder="Search vases, textiles, lighting…"><div class="search-results"></div>';
  const input=$('.search-input');
  const render=()=> {const found=products.filter(p=>(p.name+' '+p.category).toLowerCase().includes(input.value.trim().toLowerCase()));$('.search-results').innerHTML=found.length?found.map(result).join(''):'<p>No pieces found. Try “vase”, “linen”, or “lamp”.</p>';};
  input.addEventListener('input',render);render();modal.showModal();input.focus();
 });
 function renderCart() {
  const target=$('#cart-content');if(!target)return;
  if(!bag.length){target.innerHTML='<div class="empty-cart"><h2>Your bag is waiting for something beautiful.</h2><a class="store-button" href="shop.html">Explore the Collection</a></div>';return;}
  target.innerHTML=items().map(p=>`<div class="bag-row"><img src="${p.image}" alt="${p.name}" width="90" height="90"><div><h3>${p.name}</h3><p>${money(p.price)}</p><div class="quantity-controls"><button aria-label="Decrease ${p.name} quantity" data-id="${p.id}" data-change="-1">−</button><span aria-label="${p.name} quantity">${p.quantity}</span><button aria-label="Increase ${p.name} quantity" data-id="${p.id}" data-change="1">+</button></div><button class="remove-item" data-remove="${p.id}" aria-label="Remove ${p.name}">Remove</button></div><span>${money(p.price*p.quantity)}</span></div>`).join('')+`<div class="bag-total"><span>Subtotal</span><strong>${money(items().reduce((sum,p)=>sum+p.price*p.quantity,0))}</strong></div><p class="bag-note">This collection is a preview. Online checkout is not available yet.</p><div class="cart-actions"><a class="store-button" href="shop.html">Continue Shopping</a><button data-clear>Clear Bag</button></div>`;
 }
 document.addEventListener('click',e=> {
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.product)openProduct(b.dataset.product);
  if(b.dataset.add){const id=b.dataset.add;if(!products.some(p=>p.id===id))return;const old=bag.find(p=>p.id===id);if(old)old.quantity=Math.min(999,old.quantity+1);else bag.push({id,quantity:1});save();title.textContent='Added to Your Bag';content.innerHTML='<p class="status">Your piece has been added.</p><a class="store-button" href="cart.html">View Shopping Bag</a>';}
  if(b.dataset.change){bag=bag.map(p=>p.id===b.dataset.id?{...p,quantity:Math.min(999,p.quantity+Number(b.dataset.change))}:p).filter(p=>p.quantity>0);save();renderCart();}
  if(b.dataset.remove){bag=bag.filter(p=>p.id!==b.dataset.remove);save();renderCart();}
  if(b.hasAttribute('data-clear')){bag=[];save();renderCart();}
 });
 const search=$('#shop-search'), category=$('#shop-category');
 if(search&&category){
  const params=new URLSearchParams(location.search);const value=params.has('new')?'new':params.get('category')||'';if([...category.options].some(o=>o.value===value))category.value=value;
  const cats={vases:'Vases & Vessels',textiles:'Cozy Textiles',lighting:'Modern Lighting'};
  function renderShop(){const found=products.filter(p=>(!category.value||(category.value==='new'?['vase','lamp'].includes(p.id):p.category===cats[category.value]))&&(p.name+' '+p.category).toLowerCase().includes(search.value.trim().toLowerCase()));$('.shop-count').textContent=`${found.length} ${found.length===1?'piece':'pieces'}`;$('.shop-products').innerHTML=found.length?found.map(p=>`<article class="product-card"><button class="product-link" data-product="${p.id}" aria-label="View ${p.name}"><div class="product-photo"><img src="${p.image}" alt="${p.name}" width="512" height="512"></div><span class="product-name">${p.name}</span></button><p class="product-price">${money(p.price)}</p></article>`).join(''):'<p>No pieces found.</p>';}
  search.addEventListener('input',renderShop);category.addEventListener('change',renderShop);renderShop();
 }
 const validEmail=value=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
 document.querySelectorAll('.newsletter-form').forEach(form=>{
  form.addEventListener('submit',e=>{e.preventDefault();let feedback=form.parentElement.querySelector('.newsletter-feedback');if(!feedback){feedback=document.createElement('p');feedback.className='newsletter-feedback';feedback.setAttribute('role','status');form.after(feedback);}feedback.textContent=validEmail(form.querySelector('input').value)?'Thank you for your interest. Newsletter subscriptions are not available yet.':'Please enter a valid email address.';});
 });
 const contact=$('.contact-form');if(contact)contact.addEventListener('submit',e=>{e.preventDefault();const data=new FormData(contact), fields=[['name','Please enter your name.'],['email','Please enter a valid email address.'],['message','Please enter a message.']];let message='Your message has not been sent. Contact delivery is not available yet.';for(const [field,error] of fields){const input=contact.elements.namedItem(field);const value=String(data.get(field)||'').trim();const valid=field==='email'?validEmail(value):Boolean(value);input.setAttribute('aria-invalid',String(!valid));if(!valid&&message.startsWith('Your message')){message=error;input.focus();}}contact.querySelector('[role=status]').textContent=message;});
 updateCount();renderCart();
})();
