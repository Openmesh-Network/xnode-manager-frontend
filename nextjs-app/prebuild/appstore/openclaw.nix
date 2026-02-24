{
  inputs = {
    xnode-manager.url = "github:Openmesh-Network/xnode-manager";
    openclaw.url = "github:openclaw/nix-openclaw";
    nixpkgs.follows = "openclaw/nixpkgs";
  };

  nixConfig = {
    extra-substituters = [
      "https://cache.garnix.io"
    ];
    extra-trusted-public-keys = [
      "cache.garnix.io:CTFPyKSLcx5RMJKfLo5EEPUObbA78b0YQ2DTCJXqr9g="
    ];
  };

  outputs = inputs: {
    nixosConfigurations.container = inputs.nixpkgs.lib.nixosSystem {
      specialArgs = {
        inherit inputs;
      };
      modules = [
        inputs.xnode-manager.nixosModules.container
        {
          services.xnode-container.xnode-config = {
            host-platform = ./xnode-config/host-platform;
            state-version = ./xnode-config/state-version;
            hostname = ./xnode-config/hostname;
          };
        }
        inputs.openclaw.nixosModules.openclaw-gateway
        (
          { pkgs, ... }@args:
          {
            # START USER CONFIG
            services.openclaw-gateway.config.channels.telegram.tokenFile = builtins.toString (
              pkgs.writeText "openclaw-telegram.token" "PASTE TOKEN HERE" # your Telegram token: https://t.me/BotFather
            );
            services.openclaw-gateway.config.channels.telegram.allowFrom = [ 12345678 ]; # your Telegram user ID: https://t.me/userinfobot
            services.openclaw-gateway.config.agents.defaults.model.primary = "ollama/qwen2.5:0.5b";
            services.openclaw-gateway.environment.OLLAMA_API_KEY = "ollama-local";
            # END USER CONFIG

            services.openclaw-gateway.enable = true;
            services.openclaw-gateway.package =
              inputs.openclaw.packages.${pkgs.stdenv.hostPlatform.system}.openclaw-gateway;
            services.openclaw-gateway.config.gateway.mode = "local";
            services.openclaw-gateway.config.gateway.auth.token =
              "69152a9fff0cf22cff72ec21d7324c997cdf435e4ec5bde9";
            services.openclaw-gateway.config.plugins.entries.telegram.enabled = true;
          }
        )
        (
          { pkgs, ... }@args:
          args.lib.mkIf
            (args.lib.strings.hasPrefix "ollama/" args.config.services.openclaw-gateway.config.agents.defaults.model.primary)
            {
              services.ollama.enable = true;
              services.ollama.loadModels = [
                (builtins.replaceStrings [ "ollama/" ] [ "" ]
                  args.config.services.openclaw-gateway.config.agents.defaults.model.primary
                )
              ];
              systemd.services.ollama.serviceConfig.DynamicUser = args.lib.mkForce false;
              systemd.services.ollama.serviceConfig.ProtectHome = args.lib.mkForce false;
              systemd.services.ollama.serviceConfig.StateDirectory = [ "ollama/models" ];
              services.ollama.user = "ollama";
            }
        )
      ];
    };
  };
}
