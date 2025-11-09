const user_data = JSON.parse(localStorage.getItem("user-data"));

export function update_user_theme(new_theme) {
  user_data.preferences = {
    theme: new_theme
  }

  localStorage.setItem("user-data", JSON.stringify(user_data))
}

export default user_data