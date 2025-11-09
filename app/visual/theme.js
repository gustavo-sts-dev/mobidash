import user_data, { update_user_theme } from "../database/user.js";

const user_theme_preference = user_data?.preferences?.theme;

const button_change_theme = document.querySelector("#change-theme");
const sun_icon = `<i class="fa-solid fa-sun"></i>`;
const moon_icon = `<i class="fa-solid fa-moon"></i>`;

function load_theme(element) {
  if (user_theme_preference === "body-dark") {
    element.innerHTML = sun_icon;
    document.body.className = "body-dark";
  } else {
    element.innerHTML = moon_icon;
    document.body.className = "body-ligth";
  }

  console.log(user_theme_preference)
}

load_theme(button_change_theme);

function mudar_tema() {
  const warning = confirm(
    "Lembre-se de salvar suas informações antes de prosseguir."
  );
  if (warning) {
    if (user_theme_preference === "body-dark") {
      update_user_theme("body-ligth");
    } else {
      update_user_theme("body-dark");
    }

    window.location.reload();
  }
}

button_change_theme.addEventListener("click", () => {
  mudar_tema();
});
