const typingForm=document.querySelector(".typing-form");
const chatList=document.querySelector(".chat-list");
const toggleThemeButton=document.querySelector("#toggle-theme-button");
const deleteChatButton=document.querySelector("#delete-chat-button");
const suggestions=document.querySelectorAll(".suggestion-list .suggestion");


let userMessage=null;
let isResponseGenerating=false;

//API configuration
const API_KEY="AIzaSyBB8Q5cD5g8Npdd5W3HuWswUxrESrNBCFg";
const API_URL=`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;



const loadLocalStorageData=()=>{
  const savedChats=localStorage.getItem("savedChats");
const isLightMode=(localStorage.getItem("themeColor")==="light_mode");

//apply the stored theme
  document.body.classList.toggle("light_mode",isLightMode);
  toggleThemeButton.innerText=isLightMode? "dark_mode":"light_mode";

  //restore saved chats
  chatList.innerHTML=savedChats || "";

  document.body.classList.toggle("hide-header",savedChats);  //doubt
  chatList.scrollTo(0,chatList.scrollHeight); //scroll to bottom
}

loadLocalStorageData();



//create a new message element and return it
//adding all passed classes by using ...classes
const createMessageElement=(content,...classes)=>{
const div=document.createElement("div");
div.classList.add("message", ...classes);
div.innerHTML=content;
return div;
}



//Show typing effect by displaying words one by one
const showTypingEffect=(text,textElement,incomingMessageDiv)=>{
const words=text.split(' ');
let currentWordIndex=0;

const typingInterval=setInterval(()=>{
  //Append each word to the text element with a space
textElement.innerText +=(currentWordIndex===0? ' ' : ' ') + words[currentWordIndex++];
incomingMessageDiv.querySelector(".icon").classList.add("hide");


  //if all words are displayed
  if(currentWordIndex===words.length){
    clearInterval(typingInterval);
    isResponseGenerating=false;
    incomingMessageDiv.querySelector(".icon").classList.remove("hide");
    //chatList content wil be saved on local storage once response typing effect is completed
    localStorage.setItem("savedChats",chatList.innerHTML);//save chats to local storage
    chatList.scrollTo(0,chatList.scrollHeight); //scroll to bottom
  }
},75);
}

//Fetch response from the API based on user message
const generateAPIResponse= async(incomingMessageDiv)=>{
  const textElement=incomingMessageDiv.querySelector(".text"); //get text element


  //send a post request to the API with the user's message
try{
  const response=await fetch(API_URL,{
    method:"POST",
    headers:{"Content-Type": "application/json"},
    body:JSON.stringify({
      contents:[{
        role:"user",
        parts:[{text:userMessage}]
      }]
    })
  });

  const data=await response.json();
  if(!response.ok) throw new Error(data.error.message);

  //Get the API response text and remove asterisks from it
 const apiResponse=data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g,'$1');
 showTypingEffect(apiResponse,textElement,incomingMessageDiv);
  
}catch(error){
  isResponseGenerating=false;
  textElement.innerText=error.message;
  textElement.classList.add("error");
}finally{
  incomingMessageDiv.classList.remove("loading");
}
}

//show a loading animation while waiting for the API response
const showLoadingAnimation=()=>{
  const html=`<div class="message-content">
          <img src="images/gemini.svg" alt="Gemini Image" class="avatar" />
          <p class="text"></p>
          <div class="loading-indicator">
            <div class="loading-bar"></div>
            <div class="loading-bar"></div>
            <div class="loading-bar"></div>
          </div>
        </div>
        <span onclick="copyMessage(this)" class="icon material-symbols-rounded"> content_copy </span>`;

  const incomingMessageDiv=  createMessageElement(html,"incoming","loading");
  chatList.appendChild(incomingMessageDiv);

  chatList.scrollTo(0,chatList.scrollHeight); //scroll to the bottom
  generateAPIResponse(incomingMessageDiv);
}


//copy message text to the clipboard
const copyMessage=(copyIcon)=>{
  const messageText=copyIcon.parentElement.querySelector(".text").innerText;

  navigator.clipboard.writeText(messageText);
  copyIcon.innerText="done"; //show tick icon
  setTimeout(()=>copyIcon.innerText="content_copy",1000); //revert icon after 1 second
}




//handle sending outgoing chat messages
const handleOutgoingChat=()=>{
  userMessage=typingForm.querySelector(".typing-input").value.trim() || userMessage;
  //return if response is generating or usermessage is empty
  if(!userMessage || isResponseGenerating) return; //exit if there is no message

  isResponseGenerating=true;


  const html=`<div class="message-content">
          <img src="images/user.jpg" alt="User Image" class="avatar" />
          <p class="text"></p>
        </div>`;

  const outgoingMessageDiv=  createMessageElement(html,"outgoing");
  outgoingMessageDiv.querySelector(".text").innerText=userMessage;
  chatList.appendChild(outgoingMessageDiv);

  typingForm.reset(); //clear input field after every message
  chatList.scrollTo(0,chatList.scrollHeight); //scroll to the bottom
  document.body.classList.add("hide-header"); //hide the header once chat start
  setTimeout(showLoadingAnimation,500);//show loading animation after a delay
}



//set usermessage and handle outgoing chat when a suggestion is clicked
suggestions.forEach(suggestion=>{
  suggestion.addEventListener("click",()=>{
userMessage=suggestion.querySelector(".text").innerText; //getting input as a suggestion
handleOutgoingChat();
  });
})


//toggle beteen light and dark themes
toggleThemeButton.addEventListener("click",()=>{
   const isLightMode=document.body.classList.toggle("light_mode");
//lets store theme on local storage and so that user have no problem of theme on refresh
localStorage.setItem("themeColor",isLightMode? "light_mode":"dark_mode");
  toggleThemeButton.innerText=isLightMode? "dark_mode":"light_mode";
})


//Delete all chats from local storage when button is clicked
deleteChatButton.addEventListener("click",()=>{
  if(confirm("Are you sure you want to delete all messages?")){
    localStorage.removeItem("savedChats");
    loadLocalStorageData();
  }
})

//prevent default form submission and handle outgoing chat
typingForm.addEventListener("submit",(e)=>{
  e.preventDefault();

  handleOutgoingChat();


})