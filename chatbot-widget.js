let locationData = null;

function getUserLocationAndLog() {
  return fetch('https://api.ipdata.co?api-key=2f97b73b328e4407f0f3253b801a7cc3df90027ad0d7dc5e043074fd')
    .then(response => response.json())
    .then(location => {
      console.log('Location data received:', location);
      locationData = JSON.stringify(location);
     // return sendToGAS(locationData, false); // Send location data to GAS
    });
}
function sendInputToGAS3(message, isUserMessage) {
    const GAS_URL3 = 'https://script.google.com/macros/s/AKfycbzy5WMIG8xBg3s0XqXCvhrNE58uJgvagDPC9qM9hI-QWwuV1LHRRAhnoyBC_10AISaw/exec'; // Replace with your actual URL
    const queryParams = `?message=${encodeURIComponent(message)}&isUserMessage=${isUserMessage}`;

    fetch(GAS_URL3 + queryParams, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
    .then(() => {
        console.log("Input sent to Google Sheet via GAS_URL3");
    })
    .catch(error => {
        console.error("Error sending input to GAS_URL3:", error);
    });
}


// function toggleChatbot() {
//    document.getElementById('calendly-widget-container').style.display = 'none';
//     var chatWidget = document.getElementById("chat-widget");
//     if (chatWidget.style.display === "none") {
//         chatWidget.style.display = "flex";
//         localStorage.setItem('chatbotOpen', 'true');
//     } else {
//         chatWidget.style.display = "none";
//         localStorage.setItem('chatbotOpen', 'false');
//     }
// }
function convertTextToHtml(text) {
    let replacedText = text.replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, function(url) {
        return '<a href="' + url + '" target="_blank">' + url + '</a>';
    });
    
    // Convert email addresses into mailto links
    replacedText = replacedText.replace(/(\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b)/ig, function(email) {
        return '<a href="mailto:' + email + '">' + email + '</a>';
    });



    return replacedText;
}

//document.getElementById("chatbot-toggle").addEventListener("click", toggleChatbot);
const closeButton = document.getElementById('chatbot-close');
//const chatWidget = document.getElementById('chat-widget');

// closeButton.addEventListener('click', () => {
//     event.preventDefault();  // Prevent the default form submission behavior
//     chatWidget.style.display = 'none';
// });

let currentThreadId = null;


function startConversation() {
    fetch('https://chatbot-for-st-john-paul-samuelsicking.replit.app/start', {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        currentThreadId = data.thread_id;
        console.log("New conversation started with thread ID:", currentThreadId);
    })
    .catch(error => console.error('Error starting conversation:', error));
}

function createLoadingElement() {
    let loadingElement = document.createElement('div');
    loadingElement.className = 'loading-dots';
    for (let i = 0; i < 3; i++) {
        let dot = document.createElement('div');
        loadingElement.appendChild(dot);
    }
    return loadingElement;
}

function displayChatbotMessage(message) {
    let chatbox = document.getElementById('chatbox');
    let messageElement = document.createElement('p');
    messageElement.className = 'chat-assistant';
    messageElement.textContent = message;
    chatbox.appendChild(messageElement);
    messageElement.innerHTML = convertTextToHtml(message); // Use innerHTML to set the processed message
     document.getElementById('pop-sound').play();
    saveChatbotState();
   // Only log the message if it's not the introductory message
    if (message !== "Hi, how can I help you?") {
        console.log("Chatbot:", message); // Log the message
    }
}


function displayUserMessage(message) {
    let chatbox = document.getElementById('chatbox');
    let userElement = document.createElement('p');
    userElement.className = 'chat-user';
    userElement.textContent = message;
    chatbox.appendChild(userElement);
    saveChatbotState();
  console.log("User:", message); // Log the user message
}

document.getElementById('chat-form').addEventListener('submit', function(event) {
    event.preventDefault();
    let userMessage = document.getElementById('chat-input').value;

    if (!userMessage.trim()) {
        alert("Please enter a message.");
        return;
    }

    document.getElementById('messagebtn').disabled = true;
    displayUserMessage(userMessage);
    document.getElementById('chat-input').value = '';
    let loadingElement = createLoadingElement();
    // Scroll immediately after displaying the user message
    document.getElementById('chatbox').scrollTop = document.getElementById('chatbox').scrollHeight;
    //sendInputToGAS3(userMessage, true);
    document.getElementById('chatbox').appendChild(loadingElement);

    fetch('https://chatbot-for-st-john-paul-samuelsicking.replit.app/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            thread_id: currentThreadId,  
            message: userMessage 
        }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        document.getElementById('messagebtn').disabled = false;
        let loadingElement = document.querySelector('.loading-dots');
        if (loadingElement) document.getElementById('chatbox').removeChild(loadingElement);
        displayChatbotMessage(removeSourceToken(data.response));
       let chatbotResponse = data.response; // Assuming 'data.response' contains the chatbot's response
      document.getElementById('pop-sound').play(); // Play the sound here after user action
        
        //sendToGAS(chatbotResponse, false); // Send chatbot response to GAS
        document.getElementById('chat-input').value = '';
        document.getElementById('chatbox').scrollTop = document.getElementById('chatbox').scrollHeight;
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

function removeSourceToken(text) {
    return text.replace(/【.*?】/g, '');
}

function saveChatbotState() {
    const state = {
        currentThreadId: currentThreadId,
        messages: document.getElementById('chatbox').innerHTML
    };
    localStorage.setItem('chatbotState', JSON.stringify(state));
}

function clearChatbotState() {
    localStorage.removeItem('chatbotState');
    document.getElementById('chatbox').innerHTML = '';
}

window.onload = function() {
  let chatWidget = document.getElementById('chat-widget');

    let chatbox = document.getElementById('chatbox');

  
  
    if (!sessionStorage.getItem('isNewTab')) {
        clearChatbotState();
        sessionStorage.setItem('isNewTab', 'true');
        startNewConversation();
    } else {
        let savedState = localStorage.getItem('chatbotState');
        if (savedState) {
            let state = JSON.parse(savedState);
            currentThreadId = state.currentThreadId;
            chatbox.innerHTML = state.messages;
        } else {
            startNewConversation();
        }
    }
  
    let chatbotState = localStorage.getItem('chatbotOpen');

    chatWidget.style.display = 'flex';
   let chatbotOpen = localStorage.getItem('chatbotOpen');

    // Set the display of the chat widget based on the stored state
    if (chatbotOpen === 'true') {
        chatWidget.style.display = 'flex';
    } else if (chatbotOpen === 'false') {
        chatWidget.style.display = 'none';
    }


};


function startNewConversation() {
    startConversation();
    let chatbox = document.getElementById('chatbox');
    let loadingElement = createLoadingElement();
    chatbox.appendChild(loadingElement);

    setTimeout(function() {
        chatbox.removeChild(loadingElement);
        displayChatbotMessage("Hi, how may I assist you today?");
    }, 2000);
}




document.getElementById('messagebtn').addEventListener('click', function() {
    var message = document.getElementById('chat-input').value;
    if (!message.trim()) {
        alert("Please enter a message.");
        return;
    }
 
    sendToGas4(message, true);
    getUserLocationAndLog().then(() => {
      // sendToGAS(message, true); // Send user message to GAS after fetching location
    }).catch(error => {
        console.error("Error in fetching location or sending message:", error);
    });
});



function sendToGAS(message, isUserMessage) {
    var GAS_URL = 'https://script.google.com/macros/s/AKfycbxkQ4K-hVsVnfnGNkmo5Y04edKTy3JZgdtu12OJS-HxQgj_BbVDspFUJY6YHvxp08FU8w/exec';
    var queryParams = `?message=${encodeURIComponent(message)}&isUserMessage=${isUserMessage}`;
    if (locationData) {
        queryParams += `&locationData=${encodeURIComponent(locationData)}`;
    }

    fetch(GAS_URL + queryParams, {
        method: 'POST', // Specify the method
        mode: 'no-cors', // Add this line to set the request mode to 'no-cors'
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
    .then(() => {
        console.log("Message sent to Google Sheet");
    })
    .catch(error => {
        console.error("Error sending message:", error);
    });
}




// Call this function with `true` for user messages and `false` for chatbot responses


window.addEventListener('DOMContentLoaded', (event) => {
  const chatInput = document.getElementById('chat-input');
  const initialText = 'Ask a question';

  chatInput.addEventListener('focus', function() {
    if (chatInput.value === initialText) {
      chatInput.value = '';
    }
  });

  chatInput.addEventListener('blur', function() {
    if (chatInput.value === '') {
      chatInput.value = initialText;
    }
  });
});


function sendToGas4(message, isUserMessage) {
    // Define the Google Apps Script URL for this specific function
    const GAS_URL4 = 'https://script.google.com/macros/s/AKfycbxfou6Ai9Y6WzZQ64haTGFrpEpidOMWYJmmviggDQ0kCE5DyiU9tOP_jFTFenx8fpXI7A/exec';

    // Check if the message contains an email or has 6 or more digits in total
    if (message.includes('@') || (message.match(/\d/g) || []).length >= 6) {
        var queryParams = `?message=${encodeURIComponent(message)}&isUserMessage=${isUserMessage}`;
        fetch(GAS_URL4 + queryParams, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
        .then(() => {
            console.log("Message sent to Google Sheet via GAS_URL4");
        })
        .catch(error => {
            console.error("Error sending message to GAS_URL4:", error);
        });
    } else {
        console.log("No lead found in the message; not sent to Google Sheet.");
    }
}
 document.addEventListener('DOMContentLoaded', function() {
    var bookingLink = document.getElementById('book-tour-link');
    var chatbotContainer = document.getElementById('chat-widget');
    var calendlyContainer = document.getElementById('calendly-widget-container');
    var backButton = document.getElementById('back-to-chatbot');
    var chatbotToggle = document.getElementById('chatbot-toggle');

    bookingLink.addEventListener('click', function(event) {
        event.preventDefault();
        console.log('Booking link clicked'); // Debug log
        chatbotContainer.style.display = 'none';
        calendlyContainer.style.display = 'block';
    });
backButton.addEventListener('click', function() {
        calendlyContainer.style.display = 'none';
        chatbotContainer.style.display = 'flex'; // Change this to 'flex' to match your CSS
        chatbotToggle.style.display = 'block'; // Ensure the toggle button is visible
    });
});