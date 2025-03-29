// Analyze Button Functionality with Loader Integration
document.getElementById("analyzeBtn").addEventListener("click", async () => {
  // Show the loader
  document.getElementById("loader").style.display = "flex";

  const username = document.getElementById("username").value.trim();
  if (!username) {
    alert("Please enter your Instagram username.");
    document.getElementById("loader").style.display = "none";
    return;
  }

  // Clear previous results
  document.getElementById("followersList").innerHTML = "";
  document.getElementById("followingList").innerHTML = "";
  document.getElementById("notFollowingBackList").innerHTML = "";
  document.getElementById("fansList").innerHTML = "";
  document.getElementById("followersCount").textContent = "0";
  document.getElementById("followingCount").textContent = "0";
  document.getElementById("notFollowingBackCount").textContent = "0";
  document.getElementById("fansCount").textContent = "0";

  try {
    // Step 1: Get user id from username
    const userId = await getUserId(username);
    if (!userId) {
      alert(
        "Could not fetch user ID. Make sure you are logged in and the username is correct."
      );
      return;
    }

    // Step 2: Fetch followers and following (with pagination)
    const followers = await fetchFollowers(userId);
    const following = await fetchFollowing(userId);

    // Step 3: Compute "Not Following Back" and "Fans"
    const followersSet = new Set(followers.map((u) => u.username));
    const notFollowingBack = following.filter(
      (u) => !followersSet.has(u.username)
    );
    const followingSet = new Set(following.map((u) => u.username));
    const fans = followers.filter((u) => !followingSet.has(u.username));

    // Step 4: Update UI counts
    document.getElementById("followersCount").textContent = followers.length;
    document.getElementById("followingCount").textContent = following.length;
    document.getElementById("notFollowingBackCount").textContent =
      notFollowingBack.length;
    document.getElementById("fansCount").textContent = fans.length;

    // Step 5: Display users in each column
    displayUsers("followersList", followers);
    displayUsers("followingList", following);
    displayUsers("notFollowingBackList", notFollowingBack);
    displayUsers("fansList", fans);
  } catch (error) {
    console.error(error);
    alert("An error occurred. Please check the console for details.");
  } finally {
    // Hide the loader after processing
    document.getElementById("loader").style.display = "none";
  }
});

async function getUserId(username) {
  const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "X-IG-App-ID": "936619743392459",
      Accept: "application/json",
      "User-Agent": navigator.userAgent,
    },
  });
  if (!response.ok) {
    console.error("Failed to fetch user data", response.status);
    return null;
  }
  const text = await response.text();
  if (!text) {
    console.error("Empty response text");
    return null;
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    console.error("JSON parsing error", error, text);
    return null;
  }
  return data?.data?.user?.id || null;
}

async function fetchFollowers(userId) {
  const queryHash = "c76146de99bb02f6415203be841dd25a";
  let followers = [];
  let hasNextPage = true;
  let endCursor = null;

  while (hasNextPage) {
    const variables = {
      id: userId,
      include_reel: true,
      fetch_mutual: false,
      first: 50,
      after: endCursor,
    };
    const url = `https://www.instagram.com/graphql/query/?query_hash=${queryHash}&variables=${encodeURIComponent(
      JSON.stringify(variables)
    )}`;
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) {
      console.error("Failed to fetch followers");
      break;
    }
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (error) {
      console.error("JSON parsing error for followers", error, text);
      break;
    }
    const edges = data?.data?.user?.edge_followed_by?.edges || [];
    followers.push(...edges.map((edge) => edge.node));
    hasNextPage = data?.data?.user?.edge_followed_by?.page_info?.has_next_page;
    endCursor = data?.data?.user?.edge_followed_by?.page_info?.end_cursor;
  }
  return followers;
}

async function fetchFollowing(userId) {
  const queryHash = "d04b0a864b4b54837c0d870b0e77e076";
  let following = [];
  let hasNextPage = true;
  let endCursor = null;

  while (hasNextPage) {
    const variables = {
      id: userId,
      include_reel: true,
      fetch_mutual: false,
      first: 50,
      after: endCursor,
    };
    const url = `https://www.instagram.com/graphql/query/?query_hash=${queryHash}&variables=${encodeURIComponent(
      JSON.stringify(variables)
    )}`;
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) {
      console.error("Failed to fetch following");
      break;
    }
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (error) {
      console.error("JSON parsing error for following", error, text);
      break;
    }
    const edges = data?.data?.user?.edge_follow?.edges || [];
    following.push(...edges.map((edge) => edge.node));
    hasNextPage = data?.data?.user?.edge_follow?.page_info?.has_next_page;
    endCursor = data?.data?.user?.edge_follow?.page_info?.end_cursor;
  }
  return following;
}

function displayUsers(elementId, users) {
  const container = document.getElementById(elementId);
  container.innerHTML = "";
  if (users.length === 0) {
    container.innerHTML = "<p>No users found.</p>";
    return;
  }
  users.forEach((user) => {
    const div = document.createElement("div");
    div.className = "user-item";

    // Create span for username text
    const usernameSpan = document.createElement("span");
    usernameSpan.textContent = user.username;

    // Create arrow element for opening profile
    const arrowSpan = document.createElement("span");
    arrowSpan.className = "arrow";
    arrowSpan.textContent = "→";
    arrowSpan.title = "Open profile";
    arrowSpan.addEventListener("click", () => {
      window.open(`https://www.instagram.com/${user.username}`, "_blank");
    });

    div.appendChild(usernameSpan);
    div.appendChild(arrowSpan);
    container.appendChild(div);
  });
}
