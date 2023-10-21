/*
This script was created by @c_mplx to help manage lists of people that you are following on X
The script scrapes your following page and automatically unfollows everyone who doesn't follow you back

Warning: 
Use this script at your own risk! I make no guarantees that it will work for you. 
Please also be mindful that bulk removal of accounts may not be approved by X's terms of use and may therefore negatively impact your account standing in ways that I have not fully researched.

To run this script: 
Make sure you click "Following" from your profile page... you should see a list of profiles you follow
Open up your developer tools from Chrome by hitting F12 or by going into settings > more tools > developer tools
Click console
Copy the entire code below and paste in the console 
Hit enter to start the script
*/

// <---- copy all the code below this line ---->

(() => {
  const $followButtons = '[data-testid$="-unfollow"]';
  const $confirmButton = '[data-testid="confirmationSheetConfirm"]';

  const retry = {
    count: 0,
    limit: 3,
  };

  let unfollowedCount = 0;

  const scrollToTheTop = () => window.scrollTo(0, 0);
  const scrollToTheBottom = () =>
    window.scrollTo(0, document.body.scrollHeight);
  const retryLimitReached = () => retry.count === retry.limit;
  const addNewRetry = () => retry.count++;

  const sleep = ({ seconds }) =>
    new Promise((proceed) => {
      console.log(`WAITING FOR ${seconds} SECONDS...`);
      setTimeout(proceed, seconds * 1000);
    });

  const findElementByText = (textPattern, context = document) => {
    const walker = document.createTreeWalker(
      context,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (textPattern instanceof RegExp) {
            if (textPattern.test(node.nodeValue)) {
              return NodeFilter.FILTER_ACCEPT;
            }
          } else if (node.nodeValue.includes(textPattern)) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_REJECT;
        },
      },
      false
    );

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    return nodes.map((node) => node.parentElement);
  };

  const getUserName = (followButton) => {
    let container = followButton;
    while (container && !container.querySelector('a[href^="/"]')) {
      container = container.parentElement;
    }
    return container.querySelector('a[href^="/"]').innerText || "Unknown User";
  };

  const shouldUnfollow = (followButton) => {
    let container = followButton;
    const userName = getUserName(followButton);
    console.log(`Checking if ${userName} should be unfollowed...`);

    const followsYouText = /\bFollows you\b/i;

    let stepsUp = 3;
    while (container && stepsUp > 0) {
      container = container.parentElement;
      stepsUp--;
    }

    const foundFollowsYouText = findElementByText(followsYouText, container);

    if (foundFollowsYouText.length) {
      console.log(`User ${userName} is following you. Skipping...`);
      return false;
    }

    console.log(
      `User ${userName} is not following you. Proceeding to unfollow...`
    );
    return true;
  };

  const unfollowAll = async (followButtons) => {
    console.log(`Entered unfollowAll function. UNFOLLOWING USERS...`);
    for (let followButton of followButtons) {
      if (shouldUnfollow(followButton)) {
        console.log(`Attempting to unfollow user...`);
        followButton.click();
        await sleep({ seconds: 3 });
        const confirmButton = document.querySelector($confirmButton);
        confirmButton && confirmButton.click();
        await sleep({ seconds: 6 });

        const userName = getUserName(followButton);
        console.log(`Unfollowed user ${userName}.`);
        unfollowedCount++;
      }
    }
  };

  const nextBatch = async () => {
    console.log("Scrolling to load more users...");
    for (let i = 0; i < 3; i++) {
      scrollToTheBottom();
      await sleep({ seconds: 2 });
    }

    scrollToTheTop();
    await sleep({ seconds: 1 });

    const followButtons = Array.from(document.querySelectorAll($followButtons));
    const followButtonsWereFound = followButtons.length > 0;

    let accountsUnfollowedInCurrentBatch = unfollowedCount;

    if (followButtonsWereFound) {
      console.log(`${followButtons.length} follow buttons found.`);
      await unfollowAll(followButtons);

      accountsUnfollowedInCurrentBatch =
        unfollowedCount - accountsUnfollowedInCurrentBatch;

      if (accountsUnfollowedInCurrentBatch === 0) {
        addNewRetry();
      } else {
        retry.count = 0;
      }

      await sleep({ seconds: 2 });
      return nextBatch();
    } else {
      addNewRetry();
    }

    if (retryLimitReached()) {
      console.log(`NO ACCOUNTS FOUND, SO I THINK WE'RE DONE`);
      console.log(`RELOAD PAGE AND RE-RUN SCRIPT IF ANY WERE MISSED`);
      console.log(`TOTAL UNFOLLOWED: ${unfollowedCount}`);
    } else {
      await sleep({ seconds: 2 });
      return nextBatch();
    }
  };

  nextBatch();
})();
